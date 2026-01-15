import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express'; // Import Request and Response types

dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB connection
pool.getConnection()
  .then((connection: mysql.PoolConnection) => {
    console.log('Connected to MySQL database!');
    connection.release();
  })
  .catch((err: Error) => {
    console.error('Failed to connect to MySQL database:', err);
    process.exit(1); // Exit if DB connection fails
  });

// API endpoint for submitting applications
app.post('/api/applications', async (req: Request, res: Response) => {
  try {
    const applicationData = req.body;
    console.log('[backend] Received application data:', applicationData);

    const applicationId = uuidv4(); // Generate a UUID for the application

    const [result] = await pool.execute(
      `INSERT INTO applications (
        id, uber_bolt_rating, trips_completed, years_experience, 
        platform_profile_screenshot_url, security_deposit, rental_path, 
        safe_parking, why_join, id_document_url, drivers_license_prdp_url, 
        proof_of_residence_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationId,
        parseFloat(applicationData.rating),
        parseInt(applicationData.trips),
        parseInt(applicationData.experience),
        applicationData.profileScreenshotPath,
        applicationData.securityDeposit === "Yes",
        applicationData.rentalType,
        applicationData.safeParking === "Yes",
        applicationData.whyJoin,
        applicationData.idDocumentPath,
        applicationData.driversLicenseFrontPath + ',' + applicationData.driversLicenseBackPath, // Combine front and back
        applicationData.proofOfResidencePath,
      ]
    );

    console.log('[backend] Application saved to database:', result);

    // Send email using Resend
    const emailHtml = `
      <h1>New Driver Application - GridCraft Systems</h1>
      <p>Application ID: ${applicationId}</p>
      
      <h2>Driver Information</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Current Uber/Bolt Rating:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${applicationData.rating}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Number of Trips Completed:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${applicationData.trips}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Years of Experience:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${applicationData.experience}</td>
        </tr>
      </table>

      <h2>Application Responses</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Can provide R5,000 Security Deposit:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${applicationData.securityDeposit}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Rental Type Preference:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${applicationData.rentalType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Safe parking available:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${applicationData.safeParking}</td>
        </tr>
      </table>

      <h2>Why They Want to Join</h2>
      <p style="padding: 12px; background: #f5f5f5; border-radius: 8px;">${applicationData.whyJoin || 'No response provided'}</p>

      <h2>Attached Documents (URLs)</h2>
      <ul>
        <li>Platform Profile Screenshot: ${applicationData.profileScreenshotPath || 'N/A'}</li>
        <li>ID Document: ${applicationData.idDocumentPath || 'N/A'}</li>
        <li>Driver's License (Front): ${applicationData.driversLicenseFrontPath || 'N/A'}</li>
        <li>Driver's License (Back): ${applicationData.driversLicenseBackPath || 'N/A'}</li>
        <li>Proof of Residence: ${applicationData.proofOfResidencePath || 'N/A'}</li>
      </ul>

      <hr>
      <p style="color: #666; font-size: 12px;">This application was submitted through the GridCraft Systems website.</p>
    `;

    const emailPayload = {
      from: "GridCraft Systems <onboarding@resend.dev>",
      to: ["info@gridcraftsystems.co.za"], // Replace with your recipient email
      subject: `New Driver Application - GridCraft Systems (ID: ${applicationId})`,
      html: emailHtml,
    };

    const { data: emailResult, error: emailError } = await resend.emails.send(emailPayload);

    if (emailError) {
      console.error('[backend] Resend API error:', emailError);
      throw new Error(emailError.message || "Failed to send email");
    }

    console.log('[backend] Email sent successfully:', emailResult);

    res.status(200).json({ success: true, emailResult, applicationId });
  } catch (error: any) {
    console.error('[backend] Error submitting application:', error);
    res.status(500).json({ error: error.message || 'Failed to submit application' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
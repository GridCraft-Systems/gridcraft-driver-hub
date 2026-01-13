import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationRequest {
  rating: string;
  trips: string;
  experience: string;
  securityDeposit: string;
  rentalType: string;
  safeParking: string;
  whyJoin: string;
  profileScreenshotPath: string;
  idDocumentPath: string;
  driversLicenseFrontPath: string;
  driversLicenseBackPath: string;
  proofOfResidencePath: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const applicationData: ApplicationRequest = await req.json();

    // Create Supabase client with service role for accessing storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Download files from storage and convert to base64
    const attachments: { filename: string; content: string }[] = [];
    
    const filesToDownload = [
      { path: applicationData.profileScreenshotPath, name: "Platform_Profile_Screenshot" },
      { path: applicationData.idDocumentPath, name: "ID_Document" },
      { path: applicationData.driversLicenseFrontPath, name: "Drivers_License_Front" },
      { path: applicationData.driversLicenseBackPath, name: "Drivers_License_Back" },
      { path: applicationData.proofOfResidencePath, name: "Proof_of_Residence" },
    ];

    for (const file of filesToDownload) {
      if (file.path) {
        const { data, error } = await supabase.storage
          .from("application-documents")
          .download(file.path);

        if (!error && data) {
          const extension = file.path.split('.').pop() || 'pdf';
          const arrayBuffer = await data.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          attachments.push({
            filename: `${file.name}.${extension}`,
            content: base64,
          });
        }
      }
    }

    const emailHtml = `
      <h1>New Driver Application - GridCraft Systems</h1>
      
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

      <h2>Attached Documents</h2>
      <ul>
        ${attachments.map(a => `<li>${a.filename}</li>`).join('')}
      </ul>

      <hr>
      <p style="color: #666; font-size: 12px;">This application was submitted through the GridCraft Systems website.</p>
    `;

    // Send email using Resend API directly
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const emailPayload: any = {
      from: "GridCraft Systems <onboarding@resend.dev>",
      to: ["info@gridcraftsystems.co.za"],
      subject: "New Driver Application - GridCraft Systems",
      html: emailHtml,
    };

    // Add attachments if any
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    // Clean up uploaded files after sending
    for (const file of filesToDownload) {
      if (file.path) {
        await supabase.storage.from("application-documents").remove([file.path]);
      }
    }

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-application function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
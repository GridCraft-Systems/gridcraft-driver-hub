import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  address: string;
  employmentStatus: string;
  monthlyIncome: string;
  additionalInfo: string;
  documentUrls: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured");
    }

    const applicationData: ApplicationData = await req.json();
    console.log("Received application data:", { ...applicationData, documentUrls: applicationData.documentUrls?.length + " files" });

    // Download files from Supabase storage and convert to base64
    const attachments = [];
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (applicationData.documentUrls && applicationData.documentUrls.length > 0) {
      for (const url of applicationData.documentUrls) {
        try {
          // Extract the file path from the URL
          const urlObj = new URL(url);
          const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/application-documents\/(.+)/);
          
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            const fileName = filePath.split('/').pop() || 'document';
            
            console.log("Downloading file:", fileName);
            
            // Download the file
            const response = await fetch(url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              
              // Determine content type
              let contentType = response.headers.get("content-type") || "application/octet-stream";
              
              attachments.push({
                filename: fileName,
                content: base64,
                type: contentType,
              });
              
              console.log("Successfully processed file:", fileName);
            } else {
              console.error("Failed to download file:", url, response.status);
            }
          }
        } catch (fileError) {
          console.error("Error processing file:", url, fileError);
        }
      }
    }

    // Construct email HTML
    const emailHtml = `
      <h1>New Driver Application</h1>
      <h2>Personal Information</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${applicationData.firstName} ${applicationData.lastName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${applicationData.email}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${applicationData.phone}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>ID Number:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${applicationData.idNumber}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Address:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${applicationData.address}</td></tr>
      </table>
      
      <h2>Employment Information</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Employment Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${applicationData.employmentStatus}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Monthly Income:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${applicationData.monthlyIncome}</td></tr>
      </table>
      
      ${applicationData.additionalInfo ? `
      <h2>Additional Information</h2>
      <p>${applicationData.additionalInfo}</p>
      ` : ''}
      
      <h2>Attached Documents</h2>
      <p>${attachments.length} document(s) attached to this email.</p>
    `;

    // Send email via Resend
    const emailPayload: Record<string, unknown> = {
      from: "GridCraft Applications <onboarding@resend.dev>",
      to: ["info@gridcraftsystems.co.za"],
      subject: `New Driver Application: ${applicationData.firstName} ${applicationData.lastName}`,
      html: emailHtml,
    };

    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    console.log("Sending email with", attachments.length, "attachments");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();
    console.log("Resend API response:", emailResult);

    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${JSON.stringify(emailResult)}`);
    }

    // Clean up uploaded files from storage after sending
    if (applicationData.documentUrls && applicationData.documentUrls.length > 0 && supabaseUrl && supabaseKey) {
      for (const url of applicationData.documentUrls) {
        try {
          const urlObj = new URL(url);
          const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/application-documents\/(.+)/);
          
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            
            // Delete the file from storage
            await fetch(`${supabaseUrl}/storage/v1/object/application-documents/${filePath}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
              },
            });
            console.log("Deleted file from storage:", filePath);
          }
        } catch (deleteError) {
          console.error("Error deleting file:", url, deleteError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Application submitted successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Error in send-application function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

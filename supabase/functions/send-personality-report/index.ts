import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PersonalityReportRequest {
  email: string;
  userName: string;
  personalityType: string;
  score: number;
  description: string;
  recommendations: string[];
  assessmentDate: string;
  detailedScores?: {
    extroversion: number;
    introversion: number;
    thinking: number;
    feeling: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      userName,
      personalityType,
      score,
      description,
      recommendations,
      assessmentDate,
      detailedScores
    }: PersonalityReportRequest = await req.json();

    console.log("Sending personality report to:", email);

    const recommendationsList = recommendations
      .map((rec, index) => `${index + 1}. ${rec}`)
      .join('\n');

    const scoresSection = detailedScores ? `
      <h3 style="color: #8B5CF6;">Detailed Trait Scores</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #F1F5F9; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <div><strong>Extroversion:</strong> ${detailedScores.extroversion}%</div>
        <div><strong>Introversion:</strong> ${detailedScores.introversion}%</div>
        <div><strong>Thinking:</strong> ${detailedScores.thinking}%</div>
        <div><strong>Feeling:</strong> ${detailedScores.feeling}%</div>
      </div>
    ` : '';
    const emailResponse = await resend.emails.send({
      from: "PersonalityTest <onboarding@resend.dev>",
      to: [email],
      subject: "Your Personality Assessment Results",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #8B5CF6, #22C55E); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🧠 Personality Assessment Results</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your personalized personality profile</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #8B5CF6; margin-top: 0;">Hello ${userName}!</h2>
            
            <p>Thank you for taking our personality assessment. Here are your detailed results:</p>
            
            <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
              <h3 style="color: #22C55E; margin: 0 0 10px 0; font-size: 24px;">${personalityType}</h3>
              <p style="margin: 5px 0; color: #64748B;"><strong>Overall Score:</strong> ${score}%</p>
              <p style="margin: 5px 0; color: #64748B;"><strong>Assessment Date:</strong> ${assessmentDate}</p>
            </div>
            
            <h3 style="color: #8B5CF6;">Your Personality Profile</h3>
            <p style="background: #F1F5F9; padding: 15px; border-radius: 6px; margin: 15px 0;">${description}</p>
            
            ${scoresSection}
            
            <h3 style="color: #8B5CF6;">Personalized Recommendations</h3>
            <div style="background: #F1F5F9; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; margin: 0;">${recommendationsList}</pre>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #64748B;">Want to take the test again or view more results?</p>
              <p style="margin: 0;"><a href="${Deno.env.get('SUPABASE_URL') || 'https://your-app-url.com'}" style="color: #8B5CF6; text-decoration: none; font-weight: bold;">Visit PersonalityTest Dashboard →</a></p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            
            <p style="color: #64748B; font-size: 14px; text-align: center; margin: 0;">
              This report was generated on ${new Date().toLocaleDateString()}<br>
              Keep exploring your personality and personal growth!
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-personality-report function:", error);
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
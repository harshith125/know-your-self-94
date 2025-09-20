import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowLeft, Download, Mail, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PersonalityChart from "@/components/PersonalityChart";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AssessmentResult {
  id: string;
  created_at: string;
  score: number;
  level: string;
  description: string;
  recommendations: string[];
  user_id: string;
  detailed_scores?: {
    extroversion: number;
    introversion: number;
    thinking: number;
    feeling: number;
  };
}

const Results = () => {
  const { id } = useParams();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchUserProfile(session.user.id);
      await fetchResult();
      setIsLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setUserProfile(data);
    }
  };

  const fetchResult = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching result:", error);
      toast({
        title: "Error",
        description: "Failed to load assessment results.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } else {
      setResult(data);
    }
  };

  const generatePDF = async () => {
    if (!result || !userProfile) return;

    setIsGeneratingPDF(true);
    try {
      // Capture the results content as an image
      const element = document.getElementById('results-content');
      if (!element) throw new Error('Results content not found');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.getDataURL('image/png');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(88, 28, 135); // Purple color
      pdf.text("Personality Assessment Report", margin, yPosition);
      yPosition += 20;

      // User info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Name: ${userProfile.full_name}`, margin, yPosition);
      yPosition += 10;
      pdf.text(`Date: ${new Date(result.created_at).toLocaleDateString()}`, margin, yPosition);
      yPosition += 20;

      // Personality Type
      pdf.setFontSize(18);
      pdf.setTextColor(88, 28, 135);
      pdf.text("Personality Type", margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(16);
      pdf.setTextColor(34, 197, 94); // Green color
      pdf.text(result.level, margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Overall Score: ${result.score}%`, margin, yPosition);
      yPosition += 20;

      // Add scores if available
      if (result.detailed_scores) {
        pdf.setFontSize(14);
        pdf.setTextColor(88, 28, 135);
        pdf.text("Detailed Scores", margin, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Extroversion: ${result.detailed_scores.extroversion}%`, margin, yPosition);
        yPosition += 8;
        pdf.text(`Introversion: ${result.detailed_scores.introversion}%`, margin + 80, yPosition - 8);
        pdf.text(`Thinking: ${result.detailed_scores.thinking}%`, margin, yPosition);
        yPosition += 8;
        pdf.text(`Feeling: ${result.detailed_scores.feeling}%`, margin + 80, yPosition - 8);
        yPosition += 15;
      }

      // Description
      pdf.setFontSize(14);
      pdf.setTextColor(88, 28, 135);
      pdf.text("Description", margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const descriptionLines = pdf.splitTextToSize(result.description, pageWidth - 2 * margin);
      pdf.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 5 + 15;

      // Recommendations
      pdf.setFontSize(14);
      pdf.setTextColor(88, 28, 135);
      pdf.text("Recommendations", margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      result.recommendations.forEach((rec, index) => {
        const recText = `${index + 1}. ${rec}`;
        const recLines = pdf.splitTextToSize(recText, pageWidth - 2 * margin);
        pdf.text(recLines, margin, yPosition);
        yPosition += recLines.length * 5 + 5;
      });

      // Add chart image if there's space, otherwise add a new page
      if (yPosition + 100 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Add the captured image
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (imgHeight <= pageHeight - yPosition - margin) {
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      }
      // Save PDF
      pdf.save(`personality-assessment-${userProfile.full_name.replace(/\s+/g, '-')}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF report has been downloaded!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const sendEmailReport = async () => {
    if (!result || !userProfile || !user) return;

    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-personality-report', {
        body: {
          email: user.email,
          userName: userProfile.full_name,
          personalityType: result.level,
          score: result.score,
          description: result.description,
          recommendations: result.recommendations,
          assessmentDate: new Date(result.created_at).toLocaleDateString(),
          detailedScores: result.detailed_scores
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report has been sent to your email!",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getPersonalityTypeColor = (level: string) => {
    const colors = {
      "Extroverted Thinker": "from-blue-500 to-blue-600",
      "Introverted Thinker": "from-purple-500 to-purple-600",
      "Extroverted Feeler": "from-green-500 to-green-600",
      "Introverted Feeler": "from-pink-500 to-pink-600",
      "Balanced": "from-yellow-500 to-yellow-600",
    };
    return colors[level as keyof typeof colors] || "from-gray-500 to-gray-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Assessment not found</h1>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Assessment Results</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePDF}
              disabled={isGeneratingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendEmailReport}
              disabled={isSendingEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSendingEmail ? "Sending..." : "Email Report"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6" id="results-content">
          {/* Header Card */}
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getPersonalityTypeColor(result.level)} flex items-center justify-center`}>
                  <Brain className="h-12 w-12 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl">{result.level}</CardTitle>
              <CardDescription className="text-lg">
                Overall Score: {result.score}%
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Chart Visualization */}
          {result.detailed_scores && (
            <PersonalityChart 
              scores={result.detailed_scores} 
              personalityType={result.level}
            />
          )}

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Personality Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {result.description}
              </p>
            </CardContent>
          </Card>

          {/* Recommendations Card */}
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                Based on your personality type, here are some suggestions for personal and professional development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate("/test")} variant="outline">
                  Take Test Again
                </Button>
                <Button onClick={() => navigate("/dashboard")}>
                  View All Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Results;
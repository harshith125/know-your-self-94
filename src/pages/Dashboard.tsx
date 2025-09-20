import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, User, LogOut, Plus, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AssessmentResult {
  id: string;
  created_at: string;
  score: number;
  level: string;
  description: string;
  recommendations: string[];
}

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await fetchUserProfile(session.user.id);
      await fetchAssessmentResults(session.user.id);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate]);

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

  const fetchAssessmentResults = async (userId: string) => {
    const { data, error } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching results:", error);
    } else {
      setAssessmentResults(data || []);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPersonalityTypeColor = (level: string) => {
    const colors = {
      "Extroverted Thinker": "bg-gradient-to-r from-blue-500 to-blue-600",
      "Introverted Thinker": "bg-gradient-to-r from-purple-500 to-purple-600",
      "Extroverted Feeler": "bg-gradient-to-r from-green-500 to-green-600",
      "Introverted Feeler": "bg-gradient-to-r from-pink-500 to-pink-600",
      "Balanced": "bg-gradient-to-r from-yellow-500 to-yellow-600",
    };
    return colors[level as keyof typeof colors] || "bg-gradient-to-r from-gray-500 to-gray-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">PersonalityTest</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4" />
              <span>{userProfile?.full_name || user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <span>Welcome back, {userProfile?.full_name?.split(' ')[0] || 'User'}!</span>
              </CardTitle>
              <CardDescription>
                Ready to explore your personality? Take a new assessment or review your previous results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/test")} 
                className="w-full sm:w-auto"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Take New Personality Test
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6" />
                <span>Your Assessment History</span>
              </CardTitle>
              <CardDescription>
                View your previous personality assessment results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assessments taken yet</p>
                  <p className="text-sm">Take your first personality test to get started!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {assessmentResults.map((result) => (
                    <Card key={result.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getPersonalityTypeColor(result.level)}`}>
                                {result.level}
                              </div>
                              <span className="text-sm font-medium">Score: {result.score}%</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {result.description}
                            </p>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(result.created_at)}</span>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/results/${result.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Question {
  id: number;
  question: string;
  options: { text: string; value: number; category: string }[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "In social situations, you usually:",
    options: [
      { text: "Seek out conversations with many people", value: 4, category: "extroversion" },
      { text: "Enjoy talking with a few close friends", value: 3, category: "extroversion" },
      { text: "Prefer to listen rather than talk", value: 2, category: "introversion" },
      { text: "Feel drained by too much social interaction", value: 1, category: "introversion" }
    ]
  },
  {
    id: 2,
    question: "When making decisions, you tend to:",
    options: [
      { text: "Rely heavily on logic and facts", value: 4, category: "thinking" },
      { text: "Consider both logic and feelings", value: 3, category: "thinking" },
      { text: "Follow your gut feelings", value: 2, category: "feeling" },
      { text: "Prioritize how others will be affected", value: 1, category: "feeling" }
    ]
  },
  {
    id: 3,
    question: "Your ideal weekend involves:",
    options: [
      { text: "Hosting a party or gathering", value: 4, category: "extroversion" },
      { text: "Going out with close friends", value: 3, category: "extroversion" },
      { text: "A quiet day with a good book", value: 2, category: "introversion" },
      { text: "Solo activities at home", value: 1, category: "introversion" }
    ]
  },
  {
    id: 4,
    question: "When working on projects, you prefer to:",
    options: [
      { text: "Brainstorm with a team", value: 4, category: "extroversion" },
      { text: "Collaborate with a few people", value: 3, category: "extroversion" },
      { text: "Work independently with occasional input", value: 2, category: "introversion" },
      { text: "Work completely alone", value: 1, category: "introversion" }
    ]
  },
  {
    id: 5,
    question: "In conflicts, you typically:",
    options: [
      { text: "Address issues directly with facts", value: 4, category: "thinking" },
      { text: "Try to find logical solutions", value: 3, category: "thinking" },
      { text: "Consider everyone's feelings first", value: 2, category: "feeling" },
      { text: "Seek harmony and compromise", value: 1, category: "feeling" }
    ]
  },
  {
    id: 6,
    question: "You recharge your energy by:",
    options: [
      { text: "Being around lots of people", value: 4, category: "extroversion" },
      { text: "Socializing with friends", value: 3, category: "extroversion" },
      { text: "Having quiet time alone", value: 2, category: "introversion" },
      { text: "Engaging in solitary hobbies", value: 1, category: "introversion" }
    ]
  },
  {
    id: 7,
    question: "When learning something new, you prefer:",
    options: [
      { text: "Group discussions and workshops", value: 4, category: "extroversion" },
      { text: "Interactive learning with others", value: 3, category: "extroversion" },
      { text: "Self-study with some guidance", value: 2, category: "introversion" },
      { text: "Independent research and practice", value: 1, category: "introversion" }
    ]
  },
  {
    id: 8,
    question: "Your communication style is:",
    options: [
      { text: "Direct and straightforward", value: 4, category: "thinking" },
      { text: "Clear but considerate", value: 3, category: "thinking" },
      { text: "Gentle and tactful", value: 2, category: "feeling" },
      { text: "Very diplomatic and careful", value: 1, category: "feeling" }
    ]
  },
  {
    id: 9,
    question: "In groups, you usually:",
    options: [
      { text: "Take charge and lead discussions", value: 4, category: "extroversion" },
      { text: "Actively participate in conversations", value: 3, category: "extroversion" },
      { text: "Contribute when you have something important to say", value: 2, category: "introversion" },
      { text: "Prefer to observe and listen", value: 1, category: "introversion" }
    ]
  },
  {
    id: 10,
    question: "When stressed, you cope by:",
    options: [
      { text: "Talking through problems with others", value: 4, category: "extroversion" },
      { text: "Seeking advice from trusted friends", value: 3, category: "extroversion" },
      { text: "Taking time to think things through alone", value: 2, category: "introversion" },
      { text: "Withdrawing and processing internally", value: 1, category: "introversion" }
    ]
  },
  {
    id: 11,
    question: "Your decision-making process involves:",
    options: [
      { text: "Analyzing all available data", value: 4, category: "thinking" },
      { text: "Weighing pros and cons logically", value: 3, category: "thinking" },
      { text: "Considering personal values", value: 2, category: "feeling" },
      { text: "Thinking about impact on relationships", value: 1, category: "feeling" }
    ]
  },
  {
    id: 12,
    question: "You value feedback that is:",
    options: [
      { text: "Direct and specific", value: 4, category: "thinking" },
      { text: "Honest but constructive", value: 3, category: "thinking" },
      { text: "Delivered with care and empathy", value: 2, category: "feeling" },
      { text: "Focused on encouragement", value: 1, category: "feeling" }
    ]
  }
];

const Test = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { value: number; category: string }>>({});
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    };
    checkAuth();
  }, [navigate]);

  const handleAnswer = (questionId: number, value: number, category: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value, category }
    }));
  };

  const calculateResults = () => {
    const scores = {
      extroversion: 0,
      introversion: 0,
      thinking: 0,
      feeling: 0
    };

    Object.values(answers).forEach(answer => {
      scores[answer.category as keyof typeof scores] += answer.value;
    });

    const extroversionScore = Math.round((scores.extroversion / (scores.extroversion + scores.introversion)) * 100);
    const thinkingScore = Math.round((scores.thinking / (scores.thinking + scores.feeling)) * 100);
    
    let personalityType = "";
    let description = "";
    let recommendations: string[] = [];

    if (extroversionScore >= 60 && thinkingScore >= 60) {
      personalityType = "Extroverted Thinker";
      description = "You are energized by social interaction and prefer to make decisions based on logic and objective analysis. You're likely a natural leader who enjoys problem-solving and challenging discussions.";
      recommendations = [
        "Consider careers in management, consulting, or entrepreneurship",
        "Join debate clubs or leadership organizations",
        "Seek roles that involve strategic planning and team coordination",
        "Practice active listening to balance your analytical approach"
      ];
    } else if (extroversionScore >= 60 && thinkingScore < 60) {
      personalityType = "Extroverted Feeler";
      description = "You thrive in social settings and make decisions based on values and how they affect others. You're naturally empathetic and excel at building relationships and motivating people.";
      recommendations = [
        "Explore careers in counseling, teaching, or human resources",
        "Volunteer for community organizations",
        "Develop skills in conflict resolution and mediation",
        "Consider roles in sales, marketing, or public relations"
      ];
    } else if (extroversionScore < 60 && thinkingScore >= 60) {
      personalityType = "Introverted Thinker";
      description = "You prefer quiet environments for deep thinking and make decisions based on careful analysis. You're likely detail-oriented and excel at independent work requiring concentration.";
      recommendations = [
        "Consider careers in research, engineering, or software development",
        "Seek roles that allow for independent work and minimal interruptions",
        "Develop expertise in specialized technical areas",
        "Practice presenting your ideas clearly to others"
      ];
    } else if (extroversionScore < 60 && thinkingScore < 60) {
      personalityType = "Introverted Feeler";
      description = "You value quiet reflection and make decisions based on personal values and empathy. You're likely creative, compassionate, and prefer meaningful one-on-one connections.";
      recommendations = [
        "Explore careers in writing, art, or counseling",
        "Seek roles that align with your personal values",
        "Consider working in small teams or one-on-one settings",
        "Develop skills in creative expression and emotional intelligence"
      ];
    } else {
      personalityType = "Balanced";
      description = "You show a balanced approach between different personality dimensions. You can adapt your style based on the situation, drawing from both introverted and extroverted, thinking and feeling approaches.";
      recommendations = [
        "Consider careers that require versatility and adaptability",
        "Develop skills in multiple areas to leverage your flexibility",
        "Seek roles that offer variety in tasks and interactions",
        "Practice being intentional about when to use different approaches"
      ];
    }

    return {
      personalityType,
      description,
      recommendations,
      overallScore: Math.round((extroversionScore + thinkingScore) / 2),
      extroversionScore,
      thinkingScore
    };
  };

  const submitResults = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    const results = calculateResults();

    try {
      const { data, error } = await supabase
        .from("assessment_results")
        .insert({
          user_id: user.id,
          score: results.overallScore,
          answers: answers,
          description: results.description,
          recommendations: results.recommendations,
          level: results.personalityType
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to results page
      navigate(`/results/${data.id}`);
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Error",
        description: "Failed to save your results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const canProceed = answers[questions[currentQuestion]?.id];
  const isLastQuestion = currentQuestion === questions.length - 1;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
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
            <h1 className="text-xl font-bold">Personality Assessment</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {questions[currentQuestion] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {questions[currentQuestion].question}
                </CardTitle>
                <CardDescription>
                  Choose the option that best describes you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant={answers[questions[currentQuestion].id]?.value === option.value ? "default" : "outline"}
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => handleAnswer(questions[currentQuestion].id, option.value, option.category)}
                  >
                    {option.text}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {isLastQuestion ? (
              <Button
                onClick={submitResults}
                disabled={!canProceed || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? "Analyzing..." : "Get Results"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!canProceed}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Test;
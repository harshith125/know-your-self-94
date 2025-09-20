import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PersonalityScores {
  extroversion: number;
  introversion: number;
  thinking: number;
  feeling: number;
}

interface PersonalityChartProps {
  scores: PersonalityScores;
  personalityType: string;
}

const PersonalityChart = ({ scores, personalityType }: PersonalityChartProps) => {
  // Prepare data for radar chart
  const radarData = [
    {
      trait: 'Extroversion',
      score: scores.extroversion,
      fullMark: 100,
    },
    {
      trait: 'Thinking',
      score: scores.thinking,
      fullMark: 100,
    },
    {
      trait: 'Feeling',
      score: scores.feeling,
      fullMark: 100,
    },
    {
      trait: 'Introversion',
      score: scores.introversion,
      fullMark: 100,
    },
  ];

  // Prepare data for bar chart
  const barData = [
    {
      name: 'Extroversion',
      score: scores.extroversion,
      color: '#3B82F6',
    },
    {
      name: 'Introversion',
      score: scores.introversion,
      color: '#8B5CF6',
    },
    {
      name: 'Thinking',
      score: scores.thinking,
      color: '#10B981',
    },
    {
      name: 'Feeling',
      score: scores.feeling,
      color: '#F59E0B',
    },
  ];

  const getPersonalityTypeColor = (type: string) => {
    const colors = {
      "Extroverted Thinker": "#3B82F6",
      "Introverted Thinker": "#8B5CF6",
      "Extroverted Feeler": "#10B981",
      "Introverted Feeler": "#EC4899",
      "Balanced": "#F59E0B",
    };
    return colors[type as keyof typeof colors] || "#6B7280";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Personality Profile Visualization</span>
          <div 
            className="px-3 py-1 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: getPersonalityTypeColor(personalityType) }}
          >
            {personalityType}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="radar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="radar">Radar Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="radar" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke={getPersonalityTypeColor(personalityType)}
                    fill={getPersonalityTypeColor(personalityType)}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Score']}
                    labelStyle={{ color: '#374151' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="bar" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Score']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="score" fill={getPersonalityTypeColor(personalityType)} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Score Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {barData.map((item) => (
            <div key={item.name} className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {item.score}%
              </div>
              <div className="text-sm text-muted-foreground">{item.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalityChart;
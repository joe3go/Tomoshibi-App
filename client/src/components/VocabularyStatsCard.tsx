import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface VocabCount {
  level: string;
  count: number;
  color: string;
}

export default function VocabularyStatsCard() {
  const { data: vocabCounts = [], isLoading } = useQuery({
    queryKey: ["vocab-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jlpt_vocab')
        .select('jlpt_level');
      
      if (error) {
        console.error('Error fetching vocabulary counts:', error);
        return [];
      }
      
      const counts: Record<string, number> = {};
      data.forEach((item: { jlpt_level: number }) => {
        const level = `N${item.jlpt_level}`;
        counts[level] = (counts[level] || 0) + 1;
      });
      
      const levelData: VocabCount[] = [
        { level: 'N5', count: counts.N5 || 0, color: 'bg-green-500' },
        { level: 'N4', count: counts.N4 || 0, color: 'bg-blue-500' },
        { level: 'N3', count: counts.N3 || 0, color: 'bg-yellow-500' },
        { level: 'N2', count: counts.N2 || 0, color: 'bg-orange-500' },
        { level: 'N1', count: counts.N1 || 0, color: 'bg-red-500' }
      ];
      
      return levelData;
    },
  });

  const maxCount = Math.max(...vocabCounts.map(item => item.count), 1);

  if (isLoading) {
    return (
      <div className="vocab-analytics-section">
        <Card className="section-card">
          <CardHeader className="section-header">
            <CardTitle className="section-title">
              <BookOpen className="w-5 h-5" />
              JLPT Vocabulary Available
            </CardTitle>
          </CardHeader>
          <CardContent className="section-content">
            <div className="vocab-levels-grid">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="vocab-level-card animate-pulse">
                  <div className="vocab-level-header">
                    <div className="w-8 h-6 bg-gray-300 rounded"></div>
                    <div className="w-12 h-6 bg-gray-300 rounded"></div>
                  </div>
                  <div className="vocab-level-bar-container">
                    <div className="w-full h-2 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-20 h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="vocab-analytics-section">
      <Card className="section-card">
        <CardHeader className="section-header">
          <CardTitle className="section-title">
            <BookOpen className="w-5 h-5" />
            JLPT Vocabulary Available
          </CardTitle>
        </CardHeader>
        <CardContent className="section-content">
          <div className="vocab-levels-grid">
            {vocabCounts.map((levelData) => (
              <div key={levelData.level} className="vocab-level-card">
                <div className="vocab-level-header">
                  <span className={`vocab-level-badge ${levelData.color}`}>
                    {levelData.level}
                  </span>
                  <span className="vocab-level-count">{levelData.count}</span>
                </div>
                <div className="vocab-level-bar-container">
                  <div 
                    className={`vocab-level-bar ${levelData.color}`}
                    style={{ width: `${(levelData.count / maxCount) * 100}%` }}
                  ></div>
                </div>
                <p className="vocab-level-label">words available</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
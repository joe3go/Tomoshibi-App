import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { fetchVocabStats } from "@/lib/vocab-api";

interface VocabCount {
  level: string;
  count: number;
  color: string;
}

export default function VocabularyStatsCard() {
  const { data: vocabStats, isLoading } = useQuery({
    queryKey: ["vocab-counts"],
    queryFn: fetchVocabStats,
  });

  const vocabCounts = vocabStats?.data || [];

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
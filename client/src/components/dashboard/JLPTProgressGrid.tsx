
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface JLPTProgressGridProps {
  vocabStats: any;
}

export default function JLPTProgressGrid({ vocabStats }: JLPTProgressGridProps) {
  if (!vocabStats) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          JLPT Vocabulary Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['N5', 'N4', 'N3', 'N2', 'N1'].map(level => (
            <div key={level} className="text-center">
              <div className="text-2xl font-bold text-primary">
                {vocabStats[level.toLowerCase() as keyof typeof vocabStats] || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {level} Words
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

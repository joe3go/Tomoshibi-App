
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function AnalyticsCard({ title, value, icon, description, className }: AnalyticsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressCard({ title, current, total, label, className }: ProgressCardProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{label || 'Progress'}</span>
            <span>{current}/{total}</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {percentage.toFixed(0)}% complete
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  stats: Array<{
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    description?: string;
  }>;
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <AnalyticsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          description={stat.description}
        />
      ))}
    </div>
  );
}

export function AnalyticsDashboard({ 
  stats, 
  className 
}: { 
  stats: any; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Words"
          value={stats.totalWords || 0}
          description="in your vocabulary"
        />
        <AnalyticsCard
          title="Words Due"
          value={stats.wordsDue || 0}
          description="for review"
        />
        <AnalyticsCard
          title="Success Rate"
          value={`${stats.successRate || 0}%`}
          description="overall accuracy"
        />
        <AnalyticsCard
          title="Streak"
          value={`${stats.streakDays || 0} days`}
          description="current streak"
        />
      </div>
    </div>
  );
}

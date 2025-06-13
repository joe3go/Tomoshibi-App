import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricCardProps } from '@/types/dashboard';
import { cn } from '@/lib/utils';

/**
 * Reusable metric card component for dashboard analytics
 * Maintains exact styling from original dashboard cards
 */
export const MetricCard = React.memo<MetricCardProps>(({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className
}) => {
  return (
    <Card className={cn("content-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            "text-xs mt-1",
            trend === 'up' && "text-green-600",
            trend === 'down' && "text-red-600",
            trend === 'neutral' && "text-muted-foreground"
          )}>
            {trend === 'up' && '↗ Trending up'}
            {trend === 'down' && '↘ Trending down'}
            {trend === 'neutral' && '→ Stable'}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';
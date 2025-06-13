
import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Stack } from '@/components/atoms/Layout';
import { Text } from '@/components/atoms/Typography';
import { usePerformanceMetrics } from '@/hooks/usePerformance';
import { PERFORMANCE_THRESHOLDS } from '@/constants';
import { formatters } from '@/lib/utils';

interface PerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = false,
  showDetails = false,
}) => {
  const { metrics, getAverageMetrics } = usePerformanceMetrics();
  const [averageMetrics, setAverageMetrics] = useState(getAverageMetrics());

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setAverageMetrics(getAverageMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled, getAverageMetrics]);

  if (!enabled || !showDetails) {
    return null;
  }

  const getPerformanceStatus = (value: number, threshold: number) => {
    if (value > threshold * 1.5) return 'poor';
    if (value > threshold) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'poor': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className="p-4 bg-muted/20">
      <Stack gap="md">
        <Text weight="semibold" size="sm">
          Performance Metrics
        </Text>
        
        <Stack gap="sm">
          <div className="flex items-center justify-between">
            <Text size="xs" color="muted">
              Render Time
            </Text>
            <Badge 
              variant={getStatusColor(
                getPerformanceStatus(
                  averageMetrics.renderTime, 
                  PERFORMANCE_THRESHOLDS.SLOW_RENDER
                )
              )}
            >
              {averageMetrics.renderTime.toFixed(1)}ms
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <Text size="xs" color="muted">
              Memory Usage
            </Text>
            <Badge 
              variant={getStatusColor(
                getPerformanceStatus(
                  averageMetrics.memoryUsage, 
                  PERFORMANCE_THRESHOLDS.MEMORY_WARNING
                )
              )}
            >
              {formatters.percentage(averageMetrics.memoryUsage)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <Text size="xs" color="muted">
              Bundle Size
            </Text>
            <Badge 
              variant={getStatusColor(
                getPerformanceStatus(
                  averageMetrics.bundleSize, 
                  PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_WARNING
                )
              )}
            >
              {averageMetrics.bundleSize.toFixed(0)}KB
            </Badge>
          </div>
        </Stack>
        
        <Text size="xs" color="muted">
          {metrics.length} samples collected
        </Text>
      </Stack>
    </Card>
  );
};

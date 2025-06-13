
import { useEffect, useRef, useState, useCallback } from 'react';
import type { PerformanceMetrics } from '@shared/types';

interface UsePerformanceOptions {
  trackRender?: boolean;
  trackMemory?: boolean;
  trackNetwork?: boolean;
  onMetric?: (metric: string, value: number) => void;
}

interface PerformanceData {
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  bundleSize: number;
}

export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    trackRender = true,
    trackMemory = true,
    trackNetwork = true,
    onMetric,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceData>({
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    bundleSize: 0,
  });

  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(Date.now());

  // Track component render time
  useEffect(() => {
    if (trackRender) {
      renderStartTime.current = performance.now();
    }
  });

  useEffect(() => {
    if (trackRender && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({ ...prev, renderTime }));
      onMetric?.('renderTime', renderTime);
    }
  });

  // Track memory usage
  const trackMemoryUsage = useCallback(() => {
    if (trackMemory && 'memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize * 100;
      setMetrics(prev => ({ ...prev, memoryUsage }));
      onMetric?.('memoryUsage', memoryUsage);
    }
  }, [trackMemory, onMetric]);

  // Track network requests
  const trackNetworkRequests = useCallback(() => {
    if (trackNetwork) {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const networkRequests = entries.length;
      setMetrics(prev => ({ ...prev, networkRequests }));
      onMetric?.('networkRequests', networkRequests);
    }
  }, [trackNetwork, onMetric]);

  // Track bundle size (approximate)
  const trackBundleSize = useCallback(() => {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !src.startsWith('http')) {
        // Estimate size based on script count (rough approximation)
        totalSize += 100; // KB per script estimate
      }
    });

    setMetrics(prev => ({ ...prev, bundleSize: totalSize }));
    onMetric?.('bundleSize', totalSize);
  }, [onMetric]);

  // Performance observer for more detailed metrics
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint') {
            onMetric?.(entry.name, entry.startTime);
          } else if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            onMetric?.('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.navigationStart);
            onMetric?.('loadComplete', navEntry.loadEventEnd - navEntry.navigationStart);
          }
        });
      });

      observer.observe({ entryTypes: ['paint', 'navigation'] });

      return () => observer.disconnect();
    }
  }, [onMetric]);

  // Measure Core Web Vitals
  const measureWebVitals = useCallback(() => {
    if ('web-vitals' in window) {
      // This would integrate with web-vitals library
      // For now, we'll use basic performance API
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        onMetric?.(entry.name, entry.startTime);
      });
    }
  }, [onMetric]);

  useEffect(() => {
    const interval = setInterval(() => {
      trackMemoryUsage();
      trackNetworkRequests();
      trackBundleSize();
    }, 5000); // Track every 5 seconds

    measureWebVitals();

    return () => clearInterval(interval);
  }, [trackMemoryUsage, trackNetworkRequests, trackBundleSize, measureWebVitals]);

  return {
    metrics,
    trackMemoryUsage,
    trackNetworkRequests,
    trackBundleSize,
    measureWebVitals,
  };
};

// Performance monitoring context
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  const addMetric = useCallback((name: string, value: number) => {
    const metric: PerformanceMetrics = {
      responseTime: name === 'responseTime' ? value : 0,
      memoryUsage: name === 'memoryUsage' ? value : 0,
      renderTime: name === 'renderTime' ? value : 0,
      bundleSize: name === 'bundleSize' ? value : 0,
    };

    setMetrics(prev => [...prev.slice(-99), metric]); // Keep last 100 metrics
  }, []);

  const getAverageMetrics = useCallback((): PerformanceMetrics => {
    if (metrics.length === 0) {
      return {
        responseTime: 0,
        memoryUsage: 0,
        renderTime: 0,
        bundleSize: 0,
      };
    }

    const totals = metrics.reduce(
      (acc, metric) => ({
        responseTime: acc.responseTime + metric.responseTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        renderTime: acc.renderTime + metric.renderTime,
        bundleSize: acc.bundleSize + metric.bundleSize,
      }),
      { responseTime: 0, memoryUsage: 0, renderTime: 0, bundleSize: 0 }
    );

    return {
      responseTime: totals.responseTime / metrics.length,
      memoryUsage: totals.memoryUsage / metrics.length,
      renderTime: totals.renderTime / metrics.length,
      bundleSize: totals.bundleSize / metrics.length,
    };
  }, [metrics]);

  return {
    metrics,
    addMetric,
    getAverageMetrics,
  };
};

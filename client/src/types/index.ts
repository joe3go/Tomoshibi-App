
export * from '@shared/types';

// Client-specific types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  requiresAuth?: boolean;
  title?: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontFamily: string;
}

export interface AppConfig {
  apiUrl: string;
  enableDevTools: boolean;
  theme: ThemeConfig;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// Hook return types
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Performance monitoring types
export interface PerformanceEntry {
  name: string;
  duration: number;
  timestamp: number;
  type: 'render' | 'api' | 'navigation';
}

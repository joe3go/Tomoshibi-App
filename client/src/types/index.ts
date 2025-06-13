
export * from '@shared/types';
export * from './dashboard';
export * from './utilities';

// Client-specific types
export interface RouteConfig {
  readonly path: string;
  readonly component: React.ComponentType;
  readonly requiresAuth?: boolean;
  readonly title?: string;
}

export interface ThemeConfig {
  readonly mode: 'light' | 'dark';
  readonly primaryColor: string;
  readonly fontFamily: string;
}

export interface AppConfig {
  readonly apiUrl: string;
  readonly enableDevTools: boolean;
  readonly theme: ThemeConfig;
}

// Component prop types
export interface BaseComponentProps {
  readonly className?: string;
  readonly children?: React.ReactNode;
  readonly testId?: string;
}

// Hook return types
export interface UseApiReturn<T> {
  readonly data: T | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<void>;
}

// Performance monitoring types
export interface PerformanceEntry {
  readonly name: string;
  readonly duration: number;
  readonly timestamp: number;
  readonly type: 'render' | 'api' | 'navigation';
}

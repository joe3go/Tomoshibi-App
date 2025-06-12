// Base component props interface
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Route component props that extend BaseComponentProps
export interface RouteComponentProps extends BaseComponentProps {
  params?: Record<string, string | undefined>;
}

// Form field option type
export interface FormFieldOption {
  value: string;
  label: string;
  description?: string;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// Loading state type
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Error state type
export interface ErrorState {
  hasError: boolean;
  message?: string;
  details?: string;
}
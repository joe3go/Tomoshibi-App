
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'primary';
  text?: string;
  className?: string;
}

function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  text = 'Loading...', 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    default: 'border-primary border-l-transparent',
    glass: 'border-primary border-l-transparent',
    primary: 'border-primary border-l-transparent'
  };

  if (variant === 'glass') {
    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-background", className)}>
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "border-4 rounded-full animate-spin",
              sizeClasses[size],
              variantClasses[variant]
            )}></div>
            <span className="text-foreground">{text}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center space-x-3">
        <div className={cn(
          "border-4 rounded-full animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}></div>
        {text && <span className="text-foreground">{text}</span>}
      </div>
    </div>
  );
}

// Shimmer loading component for content placeholders
export function LoadingShimmer({ className }: { className?: string }) {
  return (
    <div className={cn("loading-shimmer bg-card rounded", className)}>
      <div className="h-4 bg-muted rounded animate-pulse"></div>
    </div>
  );
}

// Export both as default and named export
export default LoadingSpinner;
export { LoadingSpinner };

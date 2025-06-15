
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface JapaneseButtonProps extends ButtonProps {
  variant?: 'japanese' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
}

const EnhancedButton = forwardRef<HTMLButtonElement, JapaneseButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    if (variant === 'japanese') {
      return (
        <button
          ref={ref}
          className={cn('btn-japanese', className)}
          {...props}
        >
          {children}
        </button>
      );
    }

    if (variant === 'primary') {
      return (
        <Button
          ref={ref}
          className={cn('btn-primary', className)}
          {...props}
        >
          {children}
        </Button>
      );
    }

    if (variant === 'secondary') {
      return (
        <Button
          ref={ref}
          variant="secondary"
          className={cn('btn-secondary', className)}
          {...props}
        >
          {children}
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton };
export type { JapaneseButtonProps };

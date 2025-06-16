import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'content' | 'gold-frame' | 'glass';
}

const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: '',
      content: 'content-card',
      'gold-frame': 'gold-frame',
      glass: 'glass-card'
    };

    return (
      <Card
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      />
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

const StatsCard = forwardRef<HTMLDivElement, {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}>(({ title, value, icon, description, className }, ref) => (
  <Card ref={ref} className={cn("p-4 bg-card/50 backdrop-blur-sm", className)}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-lg font-bold text-primary">{value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {icon}
    </div>
  </Card>
));

StatsCard.displayName = 'StatsCard';

export { EnhancedCard, StatsCard };
export type { EnhancedCardProps };
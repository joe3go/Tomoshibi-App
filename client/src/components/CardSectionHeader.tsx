import React from 'react';
import { Button } from '@/components/ui/button';
import type { CardSectionHeaderProps } from '@/types/dashboard';
import { cn } from '@/lib/utils';

/**
 * Reusable card section header component
 * Maintains exact styling from original dashboard section headers
 */
export const CardSectionHeader = React.memo<CardSectionHeaderProps>(({
  title,
  subtitle,
  action,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>
        <h3 className="text-lg font-semibold text-primary">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={action.onClick}
          className="text-foreground hover:text-primary"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
});

CardSectionHeader.displayName = 'CardSectionHeader';
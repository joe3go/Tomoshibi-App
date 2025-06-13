import React from 'react';
import type { AvatarWithLabelProps } from '@/types/dashboard';
import { cn } from '@/lib/utils';

/**
 * Reusable avatar component with label and sublabel
 * Maintains exact styling from original dashboard avatar elements
 */
export const AvatarWithLabel = React.memo<AvatarWithLabelProps>(({
  src,
  alt,
  fallback,
  label,
  sublabel,
  size = 'md',
  onClick,
  className
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div 
      className={cn(
        "flex items-center space-x-3",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("avatar student", sizeClasses[size])}>
        {src ? (
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="font-medium">
            {fallback}
          </span>
        )}
      </div>
      <div>
        <h2 className={cn("font-semibold text-primary", textSizeClasses[size])}>
          {label}
        </h2>
        {sublabel && (
          <p className={cn("text-foreground", textSizeClasses[size])}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
});

AvatarWithLabel.displayName = 'AvatarWithLabel';
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import type { BaseComponentProps } from '@/types';

interface PageHeaderProps extends BaseComponentProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backPath?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = React.memo(({
  title,
  description,
  showBackButton = false,
  backPath = '/',
  icon,
  actions,
  className = ''
}) => {
  const [, setLocation] = useLocation();

  const handleBackClick = () => {
    setLocation(backPath);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showBackButton && (
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
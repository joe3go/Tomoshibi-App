
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Container, Stack } from '@/components/atoms/Layout';
import { Heading, Text } from '@/components/atoms/Typography';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/types';

interface AppLayoutProps extends BaseComponentProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Container size="md" className="py-16">
      <Stack align="center" gap="lg">
        <Heading size="h2" color="destructive">
          Something went wrong
        </Heading>
        <Text color="muted" className="text-center">
          {error.message || 'An unexpected error occurred'}
        </Text>
        <Button onClick={resetErrorBoundary} variant="outline">
          Try again
        </Button>
      </Stack>
    </Container>
  );
}

function LoadingFallback() {
  return (
    <Container size="md" className="py-8">
      <Stack gap="md">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </Stack>
    </Container>
  );
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  header,
  sidebar,
  footer,
  maxWidth = '7xl',
  padding = 'md',
  className,
  testId,
}) => {
  return (
    <div 
      className={cn('min-h-screen bg-background', className)}
      data-testid={testId}
    >
      {header && (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </header>
      )}
      
      <div className="flex">
        {sidebar && (
          <aside className="w-64 shrink-0 border-r bg-muted/20">
            {sidebar}
          </aside>
        )}
        
        <main className="flex-1">
          <Container size={maxWidth} padding={padding}>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onError={(error, errorInfo) => {
                console.error('Layout Error:', error, errorInfo);
              }}
            >
              <Suspense fallback={<LoadingFallback />}>
                {children}
              </Suspense>
            </ErrorBoundary>
          </Container>
        </main>
      </div>
      
      {footer && (
        <footer className="border-t bg-muted/20">
          {footer}
        </footer>
      )}
    </div>
  );
};

// Header component
interface AppHeaderProps extends BaseComponentProps {
  title?: string;
  actions?: React.ReactNode;
  navigation?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  actions,
  navigation,
  className,
  testId,
}) => {
  return (
    <Container size="7xl" padding="md">
      <Stack direction="row" align="center" justify="between" className={className}>
        <Stack direction="row" align="center" gap="lg">
          {title && (
            <Heading size="h4" className="font-bold">
              {title}
            </Heading>
          )}
          {navigation}
        </Stack>
        {actions}
      </Stack>
    </Container>
  );
};

// Sidebar component
interface AppSidebarProps extends BaseComponentProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
    active?: boolean;
  }>;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  items,
  className,
  testId,
}) => {
  return (
    <nav className={cn('p-4', className)} data-testid={testId}>
      <Stack gap="sm">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={item.active ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={item.onClick}
            asChild={!!item.href}
          >
            {item.href ? (
              <a href={item.href}>
                {item.icon}
                {item.label}
              </a>
            ) : (
              <>
                {item.icon}
                {item.label}
              </>
            )}
          </Button>
        ))}
      </Stack>
    </nav>
  );
};

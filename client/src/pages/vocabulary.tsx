import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

import { AppLayout, AppHeader } from '@/components/organisms/Layout/AppLayout';
import { Button } from '@/components/ui/button';
import VocabTracker from '@/components/vocab-tracker';
import { usePerformance } from '@/hooks/usePerformance';
import { ROUTES } from '@/constants';

export default function Vocabulary() {
  const [, setLocation] = useLocation();
  
  usePerformance({
    trackRender: true,
    onMetric: (metric, value) => {
      console.log(`Vocabulary page ${metric}:`, value);
    },
  });

  const handleBackClick = () => {
    setLocation(ROUTES.DASHBOARD);
  };

  const headerActions = (
    <Button
      variant="ghost"
      onClick={handleBackClick}
      className="flex items-center gap-2 text-muted-foreground hover:text-primary"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Button>
  );

  return (
    <AppLayout
      header={
        <AppHeader
          title="Vocabulary Tracker"
          actions={headerActions}
        />
      }
      maxWidth="6xl"
      testId="vocabulary-page"
    >
      <VocabTracker />
    </AppLayout>
  );
}
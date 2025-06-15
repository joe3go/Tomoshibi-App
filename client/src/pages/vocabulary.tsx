import VocabTracker from '@/components/vocab-tracker';
import { EnhancedButton } from '@/components/EnhancedButton';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Vocabulary() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <EnhancedButton
            variant="ghost"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </EnhancedButton>
        </div>
        <VocabTracker />
      </div>
    </div>
  );
}
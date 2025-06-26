import VocabTracker from '@/components/vocab-tracker';
import { EnhancedButton } from '@/components/EnhancedButton';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { logDebug, logError } from "@utils/logger";
import { sanitizeInput } from "@utils/validation";

export default function Vocabulary() {
  const [, setLocation] = useLocation();

  return (
    <div className="vocabulary-page-container">
      <div className="vocabulary-content-wrapper">
        <div className="vocabulary-navigation">
          <EnhancedButton
            variant="ghost"
            onClick={() => setLocation('/')}
            className="vocabulary-back-button"
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
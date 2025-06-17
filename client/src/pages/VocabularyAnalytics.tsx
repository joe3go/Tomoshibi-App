import { UsageAnalytics } from '@/components/UsageAnalytics';

export default function VocabularyAnalytics() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Vocabulary Analytics
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Advanced vocabulary tracking with conjugation normalization and usage patterns.
            </p>
          </div>
          
          <UsageAnalytics />
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageWithVocab } from '@/components/MessageWithVocab';
import { UsageAnalytics } from '@/components/UsageAnalytics';
// Component temporarily disabled to fix compilation issues
import { useLocation } from 'wouter';
import { ArrowLeft, Play, BarChart3, Target, Brain } from 'lucide-react';

export default function ConjugationDemo() {
  const [, setLocation] = useLocation();
  const [isTracking, setIsTracking] = useState(false);
  const [trackedWords, setTrackedWords] = useState<Array<{word: string, normalized: string}>>([]);
  // Authentication temporarily disabled

  // Sample Japanese sentences with various conjugations
  const demoSentences = [
    {
      id: 1,
      title: "Verb Conjugations",
      content: "昨日映画を見ました。今日は本を読んでいます。明日友達と会います。",
      explanation: "見ました → 見る, 読んでいます → 読む, 会います → 会う"
    },
    {
      id: 2,
      title: "Adjective Forms",
      content: "この料理はとても美味しかったです。今日は暑いですね。",
      explanation: "美味しかった → 美味しい, 暑い → 暑い (already dictionary form)"
    },
    {
      id: 3,
      title: "Complex Conjugations",
      content: "仕事が忙しくて、なかなか勉強できませんでした。",
      explanation: "忙しくて → 忙しい, できませんでした → できる"
    },
    {
      id: 4,
      title: "Te-form and Potential",
      content: "日本語が話せるようになりたいです。毎日練習しています。",
      explanation: "話せる → 話す, なりたい → なる, しています → する"
    }
  ];

  const handleTrackSentence = async (sentence: string) => {
    if (!user) {
      alert('Please sign in to test the tracking system');
      return;
    }

    setIsTracking(true);
    try {
      // Vocabulary tracking temporarily disabled
      // Track the sentence with conjugation normalization
      // await vocabularyTracker.trackUsageFromText(sentence, 'chat');
      
      // Force process any pending entries
      // await vocabularyTracker.flush();
      
      setTrackedWords(prev => [...prev, { word: sentence, normalized: 'Processing...' }]);
      
      setTimeout(() => {
        setIsTracking(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error tracking sentence:', error);
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                Conjugation-Aware Tracking Demo
              </h1>
              <p className="text-muted-foreground mt-2">
                Advanced vocabulary tracking that recognizes conjugated forms and maps them to dictionary entries
              </p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/vocabulary-analytics")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </Button>
        </div>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              How Conjugation-Aware Tracking Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">1. Detection</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  System identifies Japanese text and extracts individual words using morphological analysis
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">2. Normalization</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Conjugated forms (見ました, 読んでいる) are mapped to dictionary forms (見る, 読む)
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">3. Storage</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Both original and normalized forms are stored for accurate usage statistics
                </p>
              </div>
            </div>
            
            {!user && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-orange-800 dark:text-orange-200">
                  <strong>Sign in required:</strong> The tracking system needs authentication to store usage data to Supabase.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactive Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demo Sentences */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Try Conjugation Detection</h2>
            {demoSentences.map((sentence) => (
              <Card key={sentence.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{sentence.title}</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => handleTrackSentence(sentence.content)}
                      disabled={isTracking || !user}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-3 h-3" />
                      Track
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Japanese text with vocab popup */}
                  <MessageWithVocab 
                    content={sentence.content}
                    className="p-3 bg-muted rounded-lg font-japanese text-lg"
                  />
                  
                  {/* Explanation */}
                  <div className="text-sm text-muted-foreground">
                    <strong>Expected mappings:</strong> {sentence.explanation}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {isTracking && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Processing conjugations and storing to usage log...
                </p>
              </div>
            )}
          </div>

          {/* Analytics Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Usage Analytics</h2>
            <UsageAnalytics />
          </div>
        </div>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Libraries Used</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>kuroshiro</code> - Japanese text processing</li>
                  <li>• <code>kuromoji</code> - Morphological analysis</li>
                  <li>• <code>Supabase</code> - Cloud database storage</li>
                  <li>• <code>Drizzle ORM</code> - Type-safe database operations</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Structure</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>word_form_used</code> - Original conjugated form</li>
                  <li>• <code>word_normalized</code> - Dictionary form</li>
                  <li>• <code>confidence</code> - Normalization accuracy</li>
                  <li>• <code>part_of_speech</code> - Grammatical category</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
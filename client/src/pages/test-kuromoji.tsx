import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import FuriganaText from '@/components/furigana-text/FuriganaText';

const TestKuromojiPage: React.FC = () => {
  const [testText, setTestText] = useState('私は日本語を勉強しています。今日は良い天気ですね。');
  const [showFurigana, setShowFurigana] = useState(true);

  const testExamples = [
    '私は日本語を勉強しています。',
    '今日は良い天気ですね。',
    '昨日、友達と映画を見ました。',
    '来週、東京に行きます。',
    'この本はとても面白いです。',
    '彼女は美しい歌を歌います。',
    '図書館で本を読んでいます。',
    '新しい漢字を覚えました。'
  ];

  const handleSaveToVocab = (word: string, reading?: string) => {
    console.log('Saving to vocabulary:', { word, reading });
    // This would integrate with the existing vocabulary system
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kuromoji.js Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Text:</label>
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter Japanese text to test..."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowFurigana(!showFurigana)}
              size="sm"
              variant={showFurigana ? "default" : "outline"}
            >
              {showFurigana ? "Hide" : "Show"} Furigana
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium mb-2">Rendered with Kuromoji:</h3>
            <FuriganaText
              text={testText}
              showFurigana={showFurigana}
              showToggleButton={false}
              enableWordLookup={true}
              onSaveToVocab={handleSaveToVocab}
              className="text-lg leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {testExamples.map((example, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Example {index + 1}:
              </div>
              <Button
                onClick={() => setTestText(example)}
                variant="ghost"
                size="sm"
                className="text-left justify-start p-0 h-auto"
              >
                {example}
              </Button>
              <div className="border-t pt-2">
                <FuriganaText
                  text={example}
                  showFurigana={showFurigana}
                  showToggleButton={false}
                  enableWordLookup={true}
                  onSaveToVocab={handleSaveToVocab}
                  className="text-base"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestKuromojiPage;
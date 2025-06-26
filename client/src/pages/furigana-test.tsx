import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FuriganaText from '@/components/enhanced-furigana';

const FuriganaTest: React.FC = () => {
  const [testText, setTestText] = useState('私はアニメを見るのが好きです。特に「スパイファミリー」が面白いです。');
  const [customText, setCustomText] = useState('');

  const testSentences = [
    '私はアニメを見るのが好きです。特に「スパイファミリー」が面白いです。',
    '今日は天気がとても良いです。公園で散歩しましょう。',
    '私の趣味は読書と音楽を聞くことです。',
    '明日、友達と映画を見に行きます。とても楽しみです。',
    '日本語を勉強するのは難しいですが、とても面白いです。',
    // Test with manual furigana notation
    '私(わたし)は学校(がっこう)に行(い)きます。',
    '東京(とうきょう)は日本(にほん)の首都(しゅと)です。',
  ];

  const handleSaveToVocab = (word: string, reading?: string) => {
    console.log('Saving to vocab:', word, reading);
    // In real app, this would save to Supabase
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Japanese Furigana Text Component Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Controls */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-text">Custom Text Input:</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="custom-text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Enter Japanese text to test..."
                    className="flex-1"
                  />
                  <Button onClick={() => setTestText(customText)} disabled={!customText.trim()}>
                    Test
                  </Button>
                </div>
              </div>

              <div>
                <Label>Preset Test Sentences:</Label>
                <div className="grid gap-2 mt-2">
                  {testSentences.map((sentence, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left h-auto py-2 px-3 whitespace-normal"
                      onClick={() => setTestText(sentence)}
                    >
                      <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {sentence}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Test Text Display */}
            <div className="border-t pt-6">
              <Label className="text-lg font-semibold">Current Test:</Label>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <FuriganaText
                    text={testText}
                    showToggleButton={true}
                    enableWordLookup={true}
                    onSaveToVocab={handleSaveToVocab}
                    className="text-lg"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Instructions */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Toggle furigana display using the show/hide button</li>
                <li>• Click on any Japanese word to see its definition</li>
                <li>• Definitions are fetched from the Jisho API</li>
                <li>• Authenticated users can save words to their vocabulary</li>
                <li>• Test both kuroshiro parsing and manual furigana notation</li>
              </ul>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-2">Features:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium">Text Parsing:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Kuroshiro + Kuromoji for automatic furigana</li>
                    <li>• Manual notation support: 漢字(かんじ)</li>
                    <li>• Fallback parsing for edge cases</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Word Lookup:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Jisho API integration</li>
                    <li>• JLPT level indicators</li>
                    <li>• Supabase vocabulary tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FuriganaTest;
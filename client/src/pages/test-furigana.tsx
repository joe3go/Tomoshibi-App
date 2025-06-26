import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import FuriganaText from '@/components/FuriganaText';

export default function TestFuriganaPage() {
  const [inputText, setInputText] = useState('今日は良い天気ですね。私は日本語を勉強しています。');
  const [showFurigana, setShowFurigana] = useState(true);
  const [enableWordLookup, setEnableWordLookup] = useState(true);

  const sampleTexts = [
    '今日は良い天気ですね。',
    '私は日本語を勉強しています。',
    'アニメを見るのが好きです。',
    '東京駅で友達と会いました。',
    'この本は面白くて、とても勉強になります。',
    '明日の朝、早く起きなければなりません。'
  ];

  const handleSaveToVocab = (word: string, reading?: string) => {
    console.log('Saving to vocab:', { word, reading });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" style={{ fontFamily: '"Noto Sans JP", "Inter", sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Japanese Text Parser Test</h1>
        <p className="text-gray-600">
          Test the furigana display and word definition lookup functionality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Input Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter Japanese text here..."
              rows={4}
              className="w-full"
            />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Sample Texts:</h4>
              <div className="flex flex-wrap gap-2">
                {sampleTexts.map((sample, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText(sample)}
                    className="text-xs"
                  >
                    {sample.slice(0, 15)}{sample.length > 15 ? '...' : ''}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Controls:</h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={showFurigana ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFurigana(!showFurigana)}
                >
                  {showFurigana ? "Hide" : "Show"} Furigana
                </Button>
                <Button
                  variant={enableWordLookup ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnableWordLookup(!enableWordLookup)}
                >
                  {enableWordLookup ? "Disable" : "Enable"} Word Lookup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Rendered Output
              <div className="flex gap-2">
                {showFurigana && (
                  <Badge variant="secondary" className="text-xs">
                    Furigana ON
                  </Badge>
                )}
                {enableWordLookup && (
                  <Badge variant="secondary" className="text-xs">
                    Click Lookup ON
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inputText.trim() ? (
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <FuriganaText
                  text={inputText}
                  showFurigana={showFurigana}
                  enableWordLookup={enableWordLookup}
                  onSaveToVocab={handleSaveToVocab}
                  className="text-lg leading-relaxed"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                Enter Japanese text to see the parsed output
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">How to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Furigana Toggle:</strong> Click the toggle button to show/hide furigana (readings above kanji)</li>
            <li>• <strong>Word Definitions:</strong> Click on any word to see its definition popup</li>
            <li>• <strong>Vocabulary Saving:</strong> Click "Save to Vocab" in the popup to add words to your collection</li>
            <li>• <strong>Sample Texts:</strong> Use the sample text buttons to quickly test different Japanese sentences</li>
            <li>• <strong>Custom Input:</strong> Type or paste your own Japanese text in the input area</li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The system uses MeCab (via fugashi) for Japanese text parsing and 
              Jisho API for word definitions. Click on kanji or vocabulary words to see detailed definitions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
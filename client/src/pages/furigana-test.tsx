import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FuriganaText from '@/components/furigana-text/FuriganaText';

const FuriganaTestPage: React.FC = () => {
  const testTexts = [
    '私はアニメを見るのが好きです。',
    '日本語を勉強しています。',
    '今日は天気がいいですね。',
    '友達と一緒に映画を見に行きました。',
    '毎日コーヒーを飲みます。',
    '新しい本を読んでいます。',
    '来週の土曜日に会議があります。',
    '彼女は料理が上手です。'
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Furigana Test Page</CardTitle>
          <p className="text-gray-600">
            Testing kuroshiro-powered furigana display and Jisho API word definitions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {testTexts.map((text, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Test {index + 1}:
                </h3>
                <FuriganaText
                  text={text}
                  showToggleButton={true}
                  enableWordLookup={true}
                  onSaveToVocab={(word: string, reading?: string) => {
                    console.log('Saved to vocab:', word, reading);
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Click the toggle button to show/hide furigana</li>
            <li>• Click on any kanji word to see its definition</li>
            <li>• Definitions are fetched from Jisho API</li>
            <li>• Click "Save to Vocab" to add words to your personal collection</li>
            <li>• All styling preserves existing theme and layout</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuriganaTestPage;
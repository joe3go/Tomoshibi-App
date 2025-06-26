import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import FuriganaText from '@/components/FuriganaText';

const TestFuriganaPage = () => {
  const [showFurigana, setShowFurigana] = useState(true);
  
  // Test messages with furigana notation like the AI would send
  const testMessages = [
    "こんにちは！私(わたし)はAoiです。",
    "今日(きょう)は良い(よい)天気(てんき)ですね。",
    "私(わたし)は学生(がくせい)です。日本語(にほんご)を勉強(べんきょう)しています。",
    "アニメが好き(すき)です。特(とく)にスポーツアニメが好(す)きなんだ。君(きみ)はどう？"
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Furigana Test Page</h1>
      
      <div className="mb-6">
        <Button 
          onClick={() => setShowFurigana(!showFurigana)}
          variant="outline"
        >
          {showFurigana ? "Hide" : "Show"} Furigana
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Current state: {showFurigana ? "Showing" : "Hidden"}
        </p>
      </div>

      <div className="space-y-4">
        {testMessages.map((message, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Test Message {index + 1}:</h3>
            <div className="bg-gray-50 p-3 rounded mb-2 text-sm font-mono">
              {message}
            </div>
            <div className="bg-white p-3 rounded border">
              <FuriganaText
                text={message}
                showFurigana={showFurigana}
                showToggleButton={false}
                enableWordLookup={true}
                onSaveToVocab={(word: string, reading?: string) => {
                  console.log('Saving to vocab:', word, reading);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-medium mb-2">Debug Info:</h3>
        <p>Ruby tag support: {CSS.supports('display', 'ruby') ? 'Yes' : 'No'}</p>
        <p>Browser: {navigator.userAgent}</p>
      </div>
    </div>
  );
};

export default TestFuriganaPage;
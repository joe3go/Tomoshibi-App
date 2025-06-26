
import React from 'react';

function FontTest() {
  return (
    <div className="font-japanese p-4 border rounded-lg bg-card">
      <h3 className="font-semibold mb-2">Japanese Font Stack Test</h3>
      <div className="space-y-2">
        <div>漢字 - かんじ (Kanji)</div>
        <div>
          <ruby>漢<rt>かん</rt>字<rt>じ</rt></ruby>
        </div>
        <div className="text-sm text-muted-foreground">
          Font family: Noto Sans JP, Noto Serif JP, sans-serif
        </div>
      </div>
    </div>
  );
}

export default FontTest;
import React from 'react';

export default function FontTest() {
  return (
    <div className="p-4 bg-card border border-destructive rounded-lg">
      <ruby className="text-2xl">
        漢字<rt className="!text-destructive">かんじ</rt>
      </ruby>
      <div className="mt-2 text-sm text-muted-foreground">
        Red furigana should appear above the kanji
      </div>
      <div className="mt-4">
        <ruby className="text-lg furigana-wrapper">
          東京<rt>とうきょう</rt>は大<rt>おお</rt>きい都市<rt>とし</rt>です。
        </ruby>
      </div>
    </div>
  );
}

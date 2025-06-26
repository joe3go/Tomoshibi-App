
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

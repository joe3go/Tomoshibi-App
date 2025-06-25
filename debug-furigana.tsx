import React, { useState } from 'react';

const DebugFurigana = () => {
  const [showFurigana, setShowFurigana] = useState(true);
  
  // Test message with furigana notation
  const testMessage = "私(わたし)は学生(がくせい)です。今日(きょう)は良い(よい)天気(てんき)ですね。";
  
  // Parse text to identify kanji with furigana notation
  const parseText = (input: string) => {
    const furiganaPattern = /([一-龯々]+)[（\(]([ぁ-んァ-ヶー]+)[）\)]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(input)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: input.slice(lastIndex, match.index),
        });
      }

      // Add the furigana match
      parts.push({
        type: "furigana",
        kanji: match[1],
        reading: match[2],
      });

      lastIndex = furiganaPattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < input.length) {
      parts.push({
        type: "text",
        content: input.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: input }];
  };

  const parsedText = parseText(testMessage);
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <h3>Furigana Debug Component</h3>
      
      <button 
        onClick={() => setShowFurigana(!showFurigana)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {showFurigana ? "Hide" : "Show"} Furigana
      </button>
      
      <div className="border p-4 mb-4">
        <h4>Raw message:</h4>
        <p>{testMessage}</p>
      </div>
      
      <div className="border p-4 mb-4">
        <h4>Parsed parts:</h4>
        <pre>{JSON.stringify(parsedText, null, 2)}</pre>
      </div>
      
      <div className="border p-4">
        <h4>Rendered furigana (showFurigana: {showFurigana.toString()}):</h4>
        <div className="text-lg leading-relaxed">
          {parsedText.map((part, index) => {
            if (part.type === "furigana") {
              return showFurigana ? (
                <ruby key={index} className="inline-block mr-1">
                  {part.kanji}
                  <rt className="text-xs leading-none">{part.reading}</rt>
                </ruby>
              ) : (
                <span key={index}>{part.kanji}</span>
              );
            }
            return <span key={index}>{part.content}</span>;
          })}
        </div>
      </div>
    </div>
  );
};

export default DebugFurigana;
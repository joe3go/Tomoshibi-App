import { useMemo } from "react";

interface FuriganaTextProps {
  text: string;
  showFurigana?: boolean;
  className?: string;
}

export default function FuriganaText({ text, showFurigana = true, className = "" }: FuriganaTextProps) {
  const processedText = useMemo(() => {
    // Simple furigana processing - in a real implementation, you'd use a more sophisticated parser
    // For now, we'll just handle basic cases where kanji are followed by hiragana in parentheses
    
    // Pattern to match kanji with furigana: 漢字(かんじ)
    const furiganaPattern = /([一-龯]+)\(([あ-ん]+)\)/g;
    
    const parts: Array<{ type: 'text' | 'furigana'; content: string; reading?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add the furigana match
      parts.push({
        type: 'furigana',
        content: match[1], // kanji
        reading: match[2]  // hiragana reading
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts;
  }, [text]);

  return (
    <span className={`font-japanese ${className}`}>
      {processedText.map((part, index) => {
        if (part.type === 'furigana') {
          return (
            <span key={index} className="relative inline-block">
              {showFurigana && (
                <span className="furigana absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full text-lantern-orange/60 text-xs whitespace-nowrap">
                  {part.reading}
                </span>
              )}
              <span className="interactive-kanji cursor-pointer hover:text-lantern-orange transition-colors">
                {part.content}
              </span>
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}

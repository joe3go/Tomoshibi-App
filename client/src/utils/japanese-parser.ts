export interface ParsedToken {
  type: "text" | "furigana";
  content?: string;
  kanji?: string;
  reading?: string;
}

// Enhanced parser that handles multiple furigana notation formats
export function parseJapaneseTextWithFurigana(input: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];

  // Support multiple furigana formats:
  // 1. 漢字(かんじ) - parentheses format
  // 2. 漢字（かんじ） - full-width parentheses format  
  // 3. 漢字|かんじ - pipe format (from specification)
  const patterns = [
    /([一-龯々\u3400-\u4DBF]+)\|([ぁ-んァ-ヶー]+)/g, // pipe format
    /([一-龯々\u3400-\u4DBF]+)[（\(]([ぁ-んァ-ヶー]+)[）\)]/g // parentheses format
  ];

  let processedText = input;
  let allMatches: Array<{match: RegExpMatchArray, start: number, end: number}> = [];

  // Find all matches from all patterns
  patterns.forEach(pattern => {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(input)) !== null) {
      allMatches.push({
        match,
        start: match.index!,
        end: match.index! + match[0].length
      });
    }
  });

  // Sort matches by position
  allMatches.sort((a, b) => a.start - b.start);

  let lastIndex = 0;

  for (const {match, start, end} of allMatches) {
    // Add text before this match
    if (start > lastIndex) {
      const beforeText = input.slice(lastIndex, start);
      if (beforeText.trim()) {
        tokens.push(...parseNonFuriganaText(beforeText));
      }
    }

    // Add the furigana match
    tokens.push({
      type: "furigana",
      kanji: match[1],
      reading: match[2]
    });

    lastIndex = end;
  }

  // Add remaining text
  if (lastIndex < input.length) {
    const remainingText = input.slice(lastIndex);
    if (remainingText.trim()) {
      tokens.push(...parseNonFuriganaText(remainingText));
    }
  }

  return tokens.length > 0 ? tokens : [{ type: "text", content: input }];
}

function parseNonFuriganaText(text: string): ParsedToken[] {
  if (!text) return [];
  
  const tokens: ParsedToken[] = [];
  let currentToken = '';
  
  for (const char of text) {
    if (isPunctuation(char)) {
      // Flush current token if exists
      if (currentToken) {
        if (containsKanji(currentToken)) {
          tokens.push({
            type: "furigana",
            kanji: currentToken,
            reading: undefined // No reading available
          });
        } else {
          tokens.push({
            type: "text",
            content: currentToken
          });
        }
        currentToken = '';
      }
      // Add punctuation as text
      tokens.push({
        type: "text",
        content: char
      });
    } else {
      currentToken += char;
    }
  }
  
  // Flush remaining token
  if (currentToken) {
    if (containsKanji(currentToken)) {
      tokens.push({
        type: "furigana",
        kanji: currentToken,
        reading: undefined
      });
    } else {
      tokens.push({
        type: "text",
        content: currentToken
      });
    }
  }
  
  return tokens;
}

function containsKanji(text: string): boolean {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
}

function isPunctuation(text: string): boolean {
  return /^[。、！？「」『』（）(),.!?\s]$/.test(text);
}
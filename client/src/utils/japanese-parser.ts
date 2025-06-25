export interface ParsedToken {
  type: 'furigana' | 'text' | 'punctuation';
  surface: string;
  reading?: string;
  kanji?: string;
  pos?: string;
  basic_form?: string;
  jlpt_level?: number;
}

export interface JapaneseParserCache {
  [text: string]: ParsedToken[];
}

class JapaneseParser {
  private cache: Map<string, ParsedToken[]> = new Map();

  async parseText(text: string): Promise<ParsedToken[]> {
    if (!text || text.trim().length === 0) {
      return [{ type: 'text', surface: text }];
    }

    // Check cache first
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    // Use enhanced fallback parsing that handles both notation formats
    const parsedTokens = this.enhancedParse(text);
    
    // Cache the result
    this.cache.set(text, parsedTokens);
    return parsedTokens;
  }

  private enhancedParse(text: string): ParsedToken[] {
    // Enhanced regex pattern for furigana notation: 漢字(かんじ) or 漢字（かんじ）
    const furiganaPattern = /([一-龯々\u3400-\u4DBF]+)[（\(]([ぁ-んァ-ヶー]+)[）\)]/g;
    const parts: ParsedToken[] = [];
    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(...this.parseNonFuriganaText(beforeText));
      }

      // Add the furigana match
      parts.push({
        type: 'furigana',
        surface: match[1],
        kanji: match[1],
        reading: match[2],
        jlpt_level: this.estimateJLPTLevel(match[1])
      });

      lastIndex = furiganaPattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(...this.parseNonFuriganaText(remainingText));
    }

    return parts.length > 0 ? parts : [{ type: 'text', surface: text }];
  }

  private parseNonFuriganaText(text: string): ParsedToken[] {
    if (!text) return [];
    
    const tokens: ParsedToken[] = [];
    let currentToken = '';
    
    for (const char of text) {
      if (this.isPunctuation(char)) {
        // Flush current token if exists
        if (currentToken) {
          tokens.push(this.createTextToken(currentToken));
          currentToken = '';
        }
        // Add punctuation
        tokens.push({
          type: 'punctuation',
          surface: char
        });
      } else {
        currentToken += char;
      }
    }
    
    // Flush remaining token
    if (currentToken) {
      tokens.push(this.createTextToken(currentToken));
    }
    
    return tokens;
  }

  private createTextToken(text: string): ParsedToken {
    const hasKanji = this.containsKanji(text);
    
    return {
      type: hasKanji ? 'furigana' : 'text',
      surface: text,
      kanji: hasKanji ? text : undefined,
      jlpt_level: hasKanji ? this.estimateJLPTLevel(text) : undefined
    };
  }

  private containsKanji(text: string): boolean {
    return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
  }

  private isPunctuation(text: string): boolean {
    return /^[。、！？「」『』（）(),.!?\s]$/.test(text);
  }

  private estimateJLPTLevel(word: string): number {
    // Basic heuristic for JLPT level estimation
    if (word.length === 1 && this.containsKanji(word)) return 5; // Simple kanji
    if (word.length === 2 && this.containsKanji(word)) return 4;
    if (word.length >= 3 && this.containsKanji(word)) return 3;
    return 5; // Default to N5
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const japaneseParser = new JapaneseParser();

// Main function for parsing Japanese text with furigana
export async function parseJapaneseTextWithFurigana(text: string): Promise<ParsedToken[]> {
  return await japaneseParser.parseText(text);
}
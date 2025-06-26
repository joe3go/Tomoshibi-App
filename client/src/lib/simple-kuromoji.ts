// Simplified kuromoji integration that avoids complex CDN loading issues
interface SimpleMorpheme {
  surface_form: string;
  reading?: string;
  pos?: string;
  basic_form?: string;
}

// Simple fallback tokenizer that doesn't require external dependencies
class SimpleFallbackTokenizer {
  tokenize(text: string): SimpleMorpheme[] {
    // Basic tokenization by splitting on common boundaries
    const tokens: SimpleMorpheme[] = [];
    let currentToken = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Check if character is punctuation or space
      if (/[\s。、！？「」『』（）(),.!?]/.test(char)) {
        if (currentToken) {
          tokens.push({
            surface_form: currentToken,
            reading: currentToken,
            pos: 'unknown'
          });
          currentToken = '';
        }
        if (!/\s/.test(char)) { // Add non-space punctuation as separate tokens
          tokens.push({
            surface_form: char,
            reading: char,
            pos: 'punctuation'
          });
        }
      } else {
        currentToken += char;
      }
    }
    
    // Add remaining token
    if (currentToken) {
      tokens.push({
        surface_form: currentToken,
        reading: currentToken,
        pos: 'unknown'
      });
    }
    
    return tokens;
  }
}

// Global tokenizer instance
let tokenizerInstance: SimpleFallbackTokenizer | null = null;

export async function initializeSimpleKuromoji(): Promise<boolean> {
  try {
    console.log('Initializing simple tokenizer...');
    tokenizerInstance = new SimpleFallbackTokenizer();
    console.log('Simple tokenizer initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize simple tokenizer:', error);
    return false;
  }
}

export async function tokenizeTextSimple(text: string): Promise<SimpleMorpheme[]> {
  if (!tokenizerInstance) {
    const initialized = await initializeSimpleKuromoji();
    if (!initialized) {
      return [];
    }
  }

  try {
    return tokenizerInstance!.tokenize(text);
  } catch (error) {
    console.error('Error tokenizing text:', error);
    return [];
  }
}

// Convert katakana to hiragana for furigana display
export function katakanaToHiragana(katakana: string): string {
  return katakana.replace(/[\u30A1-\u30F6]/g, (match) => {
    const code = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(code);
  });
}

export { SimpleMorpheme };
// Browser-compatible kuromoji wrapper that avoids Node.js path issues
interface KuromojiMorpheme {
  word_id: number;
  word_type: string;
  word_position: number;
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading: string;
  pronunciation: string;
}

interface KuromojiTokenizer {
  tokenize(text: string): KuromojiMorpheme[];
}

// Global tokenizer instance
let tokenizerInstance: KuromojiTokenizer | null = null;
let initializationPromise: Promise<KuromojiTokenizer | null> | null = null;

export async function initializeBrowserKuromoji(): Promise<KuromojiTokenizer | null> {
  // Return existing instance if available
  if (tokenizerInstance) {
    return tokenizerInstance;
  }

  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start new initialization
  initializationPromise = performInitialization();
  return initializationPromise;
}

async function performInitialization(): Promise<KuromojiTokenizer | null> {
  try {
    console.log('Initializing browser-compatible kuromoji...');

    // Use a simpler approach that loads kuromoji from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js';
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        try {
          // Access global kuromoji after script loads
          const kuromoji = (window as any).kuromoji;
          if (!kuromoji) {
            throw new Error('Kuromoji not found on window object');
          }

          kuromoji.builder({
            dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/'
          }).build((err: any, tokenizer: KuromojiTokenizer) => {
            if (err) {
              console.error('Failed to build kuromoji tokenizer:', err);
              reject(err);
              return;
            }

            tokenizerInstance = tokenizer;
            console.log('Browser kuromoji initialized successfully');
            resolve(tokenizer);
          });
        } catch (error) {
          console.error('Error setting up kuromoji:', error);
          reject(error);
        }
      };

      script.onerror = () => {
        const error = new Error('Failed to load kuromoji script');
        console.error(error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('Failed to initialize browser kuromoji:', error);
    return null;
  }
}

export async function tokenizeText(text: string): Promise<KuromojiMorpheme[]> {
  const tokenizer = await initializeBrowserKuromoji();
  
  if (!tokenizer) {
    console.warn('Kuromoji tokenizer not available, using fallback');
    return [];
  }

  try {
    return tokenizer.tokenize(text);
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

export { KuromojiMorpheme, KuromojiTokenizer };
// Using kuromoji directly for morphological analysis
import { builder } from 'kuromoji';

interface NormalizationResult {
  originalForm: string;
  normalizedForm: string;
  confidence: number;
  partOfSpeech?: string;
}

// Global kuromoji tokenizer instance
let kuromojiTokenizer: any = null;

// Initialize kuromoji tokenizer
async function initializeKuromoji(): Promise<any> {
  if (kuromojiTokenizer) return kuromojiTokenizer;
  
  try {
    const tokenizer = await new Promise((resolve, reject) => {
      const kuromojiBuilder = builder({ dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/' });
      kuromojiBuilder.build((err: any, tokenizer: any) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
    
    kuromojiTokenizer = tokenizer;
    return kuromojiTokenizer;
  } catch (error) {
    console.error('Failed to initialize kuromoji:', error);
    return null;
  }
}

export async function normalizeJapaneseWord(word: string): Promise<string> {
  try {
    const tokenizer = await initializeKuromoji();
    if (!tokenizer) {
      return word; // Return original if kuromoji fails
    }
    
    // Use kuromoji to tokenize and get the basic form
    const morphemes = tokenizer.tokenize(word);
    
    if (morphemes && morphemes.length > 0) {
      // Return the basic form of the first morpheme, or original if no basic form
      return morphemes[0].basic_form || word;
    }
    
    return word;
  } catch (error) {
    console.error('Error normalizing Japanese word:', error);
    return word; // Return original word if normalization fails
  }
}

export async function extractVocabularyFromText(text: string): Promise<string[]> {
  try {
    const tokenizer = await initializeKuromoji();
    if (!tokenizer) {
      // Fallback: extract basic words using regex
      return extractBasicWords(text);
    }
    
    // Use kuromoji for proper morphological analysis
    const morphemes = tokenizer.tokenize(text);
    const vocabulary: string[] = [];
    
    for (const morpheme of morphemes) {
      // Extract meaningful words (nouns, verbs, adjectives, etc.)
      if (morpheme.pos && 
          (morpheme.pos.includes('名詞') || 
           morpheme.pos.includes('動詞') || 
           morpheme.pos.includes('形容詞') ||
           morpheme.pos.includes('副詞'))) {
        
        const baseForm = morpheme.basic_form || morpheme.surface_form;
        if (baseForm && baseForm.length > 1) { // Skip single character words
          vocabulary.push(baseForm);
        }
      }
    }
    
    return Array.from(new Set(vocabulary)); // Remove duplicates
  } catch (error) {
    console.error('Error extracting vocabulary:', error);
    return extractBasicWords(text);
  }
}

// Fallback function for basic word extraction using regex
function extractBasicWords(text: string): string[] {
  // Extract Japanese words (hiragana, katakana, kanji combinations)
  const words = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g) || [];
  return words.filter(word => word.length > 1); // Filter out single characters
}

// Legacy class for backward compatibility
class ConjugationNormalizer {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      await initializeKuromoji();
      this.isInitialized = true;
      console.log('Japanese conjugation normalizer initialized');
    } catch (error) {
      console.error('Failed to initialize conjugation normalizer:', error);
      throw error;
    }
  }

  async normalizeWord(word: string): Promise<NormalizationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const normalizedForm = await normalizeJapaneseWord(word);
      
      return {
        originalForm: word,
        normalizedForm: normalizedForm,
        confidence: normalizedForm !== word ? 0.8 : 1.0,
        partOfSpeech: undefined // Would need more analysis to determine
      };
    } catch (error) {
      console.error('Error normalizing word:', error);
      return {
        originalForm: word,
        normalizedForm: word,
        confidence: 0.0
      };
    }
  }

  async extractVocabulary(text: string): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return extractVocabularyFromText(text);
  }
}

// Export singleton instance
export const conjugationNormalizer = new ConjugationNormalizer();

// Export individual functions for direct use
export { extractBasicWords };
// Using simple tokenizer
import { initializeSimpleKuromoji, tokenizeTextSimple } from '@/lib/simple-kuromoji';

interface NormalizationResult {
  originalForm: string;
  normalizedForm: string;
  confidence: number;
  partOfSpeech?: string;
}

// Simple initialization wrapper
async function initializeKuromoji(): Promise<boolean> {
  try {
    return await initializeSimpleKuromoji();
  } catch (error) {
    console.error('Failed to initialize simple tokenizer:', error);
    return false;
  }
}

export async function normalizeJapaneseWord(word: string): Promise<string> {
  try {
    const isReady = await initializeKuromoji();
    if (!isReady) {
      return word; // Return original if kuromoji fails
    }
    
    // Use simple tokenizer to get the basic form
    const morphemes = await tokenizeTextSimple(word);
    
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
    const isReady = await initializeKuromoji();
    if (!isReady) {
      // Fallback: extract basic words using regex
      return extractBasicWords(text);
    }
    
    // Use simple tokenizer for basic morphological analysis
    const morphemes = await tokenizeTextSimple(text);
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
      const isReady = await initializeKuromoji();
      this.isInitialized = isReady;
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
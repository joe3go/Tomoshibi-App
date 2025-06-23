// Browser-compatible path operations
const path = {
  join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
  resolve: (p: string) => p
};
// @ts-ignore - Kuroshiro types not available
import Kuroshiro from 'kuroshiro';
// @ts-ignore - Kuromoji analyzer types not available
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

interface NormalizationResult {
  originalForm: string;
  normalizedForm: string;
  confidence: number;
  partOfSpeech?: string;
}

class ConjugationNormalizer {
  private kuroshiro: Kuroshiro | null = null;
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
      this.kuroshiro = new Kuroshiro();
      await this.kuroshiro.init(new KuromojiAnalyzer());
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

    if (!this.kuroshiro) {
      throw new Error('Kuroshiro not initialized');
    }

    try {
      // Get morphological analysis
      const tokens = await this.kuroshiro.util.tokenize(word);

      if (tokens.length === 0) {
        return {
          originalForm: word,
          normalizedForm: word,
          confidence: 0
        };
      }

      // Find the most likely token (usually the first meaningful one)
      const primaryToken = tokens.find((token: any) => 
        token.part_of_speech && 
        !token.part_of_speech.includes('助詞') && // Not a particle
        !token.part_of_speech.includes('記号')    // Not a symbol
      ) || tokens[0];

      // Extract base form
      const baseForm = primaryToken.basic_form || primaryToken.surface_form;
      const partOfSpeech = primaryToken.part_of_speech;

      // Calculate confidence based on whether we found a different base form
      const confidence = baseForm !== word ? 0.9 : 0.5;

      return {
        originalForm: word,
        normalizedForm: baseForm,
        confidence,
        partOfSpeech
      };

    } catch (error) {
      console.error('Error normalizing word:', word, error);
      return {
        originalForm: word,
        normalizedForm: word,
        confidence: 0
      };
    }
  }

  async normalizeText(text: string): Promise<NormalizationResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.kuroshiro) {
      throw new Error('Kuroshiro not initialized');
    }

    try {
      const tokens = await this.kuroshiro.util.tokenize(text);
      const results: NormalizationResult[] = [];

      for (const token of tokens) {
        // Skip particles, symbols, and punctuation
        if (token.part_of_speech && (
          token.part_of_speech.includes('助詞') ||
          token.part_of_speech.includes('記号') ||
          token.part_of_speech.includes('補助記号')
        )) {
          continue;
        }

        const baseForm = token.basic_form || token.surface_form;
        const confidence = baseForm !== token.surface_form ? 0.9 : 0.5;

        results.push({
          originalForm: token.surface_form,
          normalizedForm: baseForm,
          confidence,
          partOfSpeech: token.part_of_speech
        });
      }

      return results;
    } catch (error) {
      console.error('Error normalizing text:', text, error);
      return [];
    }
  }

  // Static method for common conjugation patterns (fallback)
  static basicNormalize(word: string): string {
    // Basic verb patterns
    const verbPatterns = [
      { pattern: /(.+)ます$/, replacement: '$1る' },      // polite form
      { pattern: /(.+)ました$/, replacement: '$1る' },     // past polite
      { pattern: /(.+)たい$/, replacement: '$1る' },      // want to
      { pattern: /(.+)った$/, replacement: '$1る' },      // past tense
      { pattern: /(.+)んだ$/, replacement: '$1む' },      // past tense (mu verbs)
      { pattern: /(.+)いた$/, replacement: '$1く' },      // past tense (ku verbs)
      { pattern: /(.+)した$/, replacement: '$1す' },      // past tense (su verbs)
      { pattern: /(.+)ない$/, replacement: '$1る' },      // negative
      { pattern: /(.+)なかった$/, replacement: '$1る' },   // past negative
    ];

    // Basic adjective patterns
    const adjectivePatterns = [
      { pattern: /(.+)かった$/, replacement: '$1い' },    // past tense i-adjectives
      { pattern: /(.+)くない$/, replacement: '$1い' },    // negative i-adjectives
      { pattern: /(.+)くなかった$/, replacement: '$1い' }, // past negative i-adjectives
    ];

    const allPatterns = [...verbPatterns, ...adjectivePatterns];

    for (const { pattern, replacement } of allPatterns) {
      if (pattern.test(word)) {
        return word.replace(pattern, replacement);
      }
    }

    return word;
  }
}

// Singleton instance
export const conjugationNormalizer = new ConjugationNormalizer();

// Export the class for testing
export { ConjugationNormalizer };
export type { NormalizationResult };
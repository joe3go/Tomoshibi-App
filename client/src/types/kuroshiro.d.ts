// Type definitions for kuroshiro
declare module 'kuroshiro' {
  interface ConvertOptions {
    mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
    to?: 'hiragana' | 'katakana' | 'romaji';
    delimiter_start?: string;
    delimiter_end?: string;
  }

  class Kuroshiro {
    constructor();
    init(analyzer: any): Promise<void>;
    convert(text: string, options?: ConvertOptions): Promise<string>;
  }

  export default Kuroshiro;
}

declare module 'kuroshiro-analyzer-kuromoji' {
  interface KuromojiAnalyzerOptions {
    dictPath?: string;
  }

  class KuromojiAnalyzer {
    constructor(options?: KuromojiAnalyzerOptions);
  }

  export default KuromojiAnalyzer;
}
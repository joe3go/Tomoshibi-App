// Type definitions for kuromoji
declare module 'kuromoji' {
  interface TokenizerBuilderOptions {
    dicPath?: string;
  }

  interface Morpheme {
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

  interface Tokenizer {
    tokenize(text: string): Morpheme[];
  }

  interface TokenizerBuilder {
    build(callback: (err: Error | null, tokenizer: Tokenizer | null) => void): void;
  }

  function builder(options?: TokenizerBuilderOptions): TokenizerBuilder;

  export { builder, Tokenizer, Morpheme, TokenizerBuilderOptions };
}
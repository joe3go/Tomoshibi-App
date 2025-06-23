import VocabularyBrowser from "@/components/vocabulary-browser";

export default function VocabularyComprehensive() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          JLPT Vocabulary Library
        </h1>
        <p className="text-muted-foreground">
          Browse and search through our comprehensive collection of Japanese vocabulary organized by JLPT levels.
        </p>
      </div>
      
      <VocabularyBrowser />
    </div>
  );
}
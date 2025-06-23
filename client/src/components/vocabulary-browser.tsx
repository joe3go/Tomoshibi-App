import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, BookOpen, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchVocabulary, fetchVocabStats, type VocabEntry, type VocabFilters } from "@/lib/vocab-api";

const ITEMS_PER_PAGE = 50;

export default function VocabularyBrowser() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedWordType, setSelectedWordType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState("browse");

  // Fetch vocabulary statistics
  const { data: vocabStats } = useQuery({
    queryKey: ["vocab-stats"],
    queryFn: fetchVocabStats,
  });

  // Build filters
  const filters: VocabFilters = useMemo(() => {
    const filterObj: VocabFilters = {};
    
    if (selectedLevel !== "all") {
      filterObj.jlpt_level = parseInt(selectedLevel);
    }
    
    if (selectedWordType !== "all") {
      filterObj.word_type = selectedWordType;
    }
    
    if (searchTerm.trim()) {
      filterObj.search = searchTerm.trim();
    }
    
    return filterObj;
  }, [selectedLevel, selectedWordType, searchTerm]);

  // Fetch vocabulary with pagination and filters
  const { data: vocabularyData, isLoading } = useQuery({
    queryKey: ["vocabulary-paginated", filters, currentPage],
    queryFn: () => fetchVocabulary({
      filters,
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
      orderBy: "jlpt_level",
      orderDirection: "asc"
    }),
  });

  const vocabulary = vocabularyData?.data || [];
  const totalCount = vocabularyData?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get unique word types for filter dropdown
  const { data: allVocabData } = useQuery({
    queryKey: ["all-vocab-types"],
    queryFn: () => fetchVocabulary({ limit: 10000 }),
  });

  const wordTypes = useMemo(() => {
    if (!allVocabData?.data) return [];
    const types = new Set(allVocabData.data.map(item => item.word_type).filter((type): type is string => Boolean(type)));
    return Array.from(types).sort();
  }, [allVocabData]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleLevelFilter = (level: string) => {
    setSelectedLevel(level);
    setCurrentPage(0);
  };

  const handleWordTypeFilter = (type: string) => {
    setSelectedWordType(type);
    setCurrentPage(0);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedLevel("all");
    setSelectedWordType("all");
    setCurrentPage(0);
  };

  return (
    <div className="vocabulary-browser-container">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Vocabulary</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Vocabulary Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vocabStats?.data.map((stat) => (
                  <div key={stat.level} className="bg-card p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" style={{ color: stat.color }}>
                        {stat.level}
                      </Badge>
                      <span className="text-2xl font-bold">{stat.count.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">words available</div>
                    <Progress 
                      value={(stat.count / (vocabStats?.totalCount || 1)) * 100} 
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <div className="text-3xl font-bold text-primary">
                  {vocabStats?.totalCount.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">total vocabulary entries</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search kanji or hiragana..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedLevel} onValueChange={handleLevelFilter}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="5">N5</SelectItem>
                    <SelectItem value="4">N4</SelectItem>
                    <SelectItem value="3">N3</SelectItem>
                    <SelectItem value="2">N2</SelectItem>
                    <SelectItem value="1">N1</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedWordType} onValueChange={handleWordTypeFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Word Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {wordTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Showing {vocabulary.length} of {totalCount.toLocaleString()} words</span>
                {(searchTerm || selectedLevel !== "all" || selectedWordType !== "all") && (
                  <Badge variant="secondary">Filtered</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vocabulary List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vocabulary Entries
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 rounded-lg border animate-pulse">
                      <div className="w-12 h-6 bg-gray-300 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
                        <div className="w-1/2 h-3 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : vocabulary.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No vocabulary found matching your criteria.</p>
                  <Button variant="link" onClick={resetFilters} className="mt-2">
                    Clear filters to see all vocabulary
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {vocabulary.map((word: VocabEntry) => (
                    <div key={word.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-xs">
                          N{word.jlpt_level}
                        </Badge>
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            {word.kanji && (
                              <span className="font-medium text-lg">{word.kanji}</span>
                            )}
                            <span className="text-sm text-muted-foreground">{word.hiragana}</span>
                          </div>
                          <span className="text-sm">{word.english_meaning}</span>
                        </div>
                      </div>
                      {word.word_type && (
                        <Badge variant="secondary" className="text-xs">
                          {word.word_type}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-4 py-2 text-sm">
                  {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
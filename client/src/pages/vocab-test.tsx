import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageWithVocab } from '@/components/MessageWithVocab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function VocabTest() {
  const [, setLocation] = useLocation();

  const testMessages = [
    {
      id: 1,
      title: "Basic Greetings",
      content: "こんにちは！今日はいい天気ですね。お元気ですか？",
      level: "N5"
    },
    {
      id: 2,
      title: "Daily Activities", 
      content: "毎朝七時に起きて、朝ごはんを食べます。それから学校に行きます。",
      level: "N4"
    },
    {
      id: 3,
      title: "Shopping Conversation",
      content: "すみません、この本はいくらですか？千円です。ありがとうございます。",
      level: "N5"
    },
    {
      id: 4,
      title: "Work Discussion",
      content: "来週の会議について話し合いましょう。新しいプロジェクトの計画を検討する必要があります。",
      level: "N3"
    },
    {
      id: 5,
      title: "Weather Talk",
      content: "今日は雨が降っています。傘を持って行った方がいいと思います。",
      level: "N4"
    },
    {
      id: 6,
      title: "Restaurant Order",
      content: "メニューを見せてください。ラーメンとギョーザをお願いします。",
      level: "N5"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Vocabulary Popup System Test</h1>
              <p className="text-muted-foreground">Click on Japanese words to see definitions, audio, and save to your vocabulary vault</p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Yomichan-style
          </Badge>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">1</span>
              <span>Click on any Japanese word in the messages below</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">2</span>
              <span>View the popup with word meaning, reading, and pronunciation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">3</span>
              <span>Click "Audio" to hear pronunciation (if available)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">4</span>
              <span>Click "Save" to add the word to your vocabulary vault</span>
            </div>
            <div className="mt-3 p-2 bg-muted rounded text-xs text-muted-foreground">
              Words are automatically detected and looked up from your imported JLPT vocabulary database with {/* Dynamic count would go here */} authentic entries.
            </div>
          </CardContent>
        </Card>

        {/* Test Messages */}
        <div className="grid gap-4">
          {testMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{message.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {message.level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <MessageWithVocab
                  content={message.content}
                  className="text-lg leading-relaxed p-4 bg-muted/30 rounded-md"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Features</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Smart Detection</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Automatic Japanese word boundary detection</li>
                <li>• Longest matching dictionary lookup</li>
                <li>• Works with kanji, hiragana, and katakana</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Cloud Integration</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Saves to Supabase when authenticated</li>
                <li>• localStorage fallback for offline use</li>
                <li>• Prevents duplicate vocabulary entries</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Audio Support</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• LanguagePod101 pronunciation audio</li>
                <li>• Graceful fallback when audio unavailable</li>
                <li>• Visual feedback during playback</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">UI Excellence</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Auto-positioning to avoid viewport overflow</li>
                <li>• Keyboard shortcuts (ESC to close)</li>
                <li>• Dark mode support</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center pt-4">
          <Button onClick={() => setLocation("/my-vocabulary")} variant="outline">
            View Vocabulary Vault
          </Button>
        </div>
      </div>
    </div>
  );
}
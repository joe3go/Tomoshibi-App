import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Settings, Eye, EyeOff, Keyboard } from "lucide-react";
import * as wanakana from "wanakana";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface EnhancedChatInputProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: () => void;
  isLoading: boolean;
  showFurigana: boolean;
  onToggleFurigana: () => void;
  placeholder?: string;
}

export default function EnhancedChatInput({
  message,
  setMessage,
  onSendMessage,
  isLoading,
  showFurigana,
  onToggleFurigana,
  placeholder = "Type your response in Japanese... (English is ok too!)"
}: EnhancedChatInputProps) {
  const [inputMode, setInputMode] = useState<'normal' | 'romaji'>(() => {
    const saved = localStorage.getItem('chat-input-mode');
    return (saved as 'normal' | 'romaji') || 'normal';
  });
  
  const [autoConvert, setAutoConvert] = useState(() => {
    const saved = localStorage.getItem('wanakana-auto-convert');
    return saved !== null ? saved === 'true' : true;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Wanakana on the textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (inputMode === 'romaji' && autoConvert) {
      // Bind Wanakana to automatically convert romaji to hiragana
      wanakana.bind(textarea, {
        IMEMode: true, // Better for Japanese IME users
        useObsoleteKana: false,
      });
    } else {
      // Unbind Wanakana
      wanakana.unbind(textarea);
    }

    return () => {
      if (textarea) {
        wanakana.unbind(textarea);
      }
    };
  }, [inputMode, autoConvert]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('chat-input-mode', inputMode);
  }, [inputMode]);

  useEffect(() => {
    localStorage.setItem('wanakana-auto-convert', autoConvert.toString());
  }, [autoConvert]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const convertToHiragana = () => {
    const converted = wanakana.toHiragana(message);
    setMessage(converted);
  };

  const convertToKatakana = () => {
    const converted = wanakana.toKatakana(message);
    setMessage(converted);
  };

  const convertToRomaji = () => {
    const converted = wanakana.toRomaji(message);
    setMessage(converted);
  };

  // Quick insert suggestions for common phrases
  const quickPhrases = [
    { japanese: "すみません", romaji: "sumimasen", english: "Excuse me/Sorry" },
    { japanese: "ありがとうございます", romaji: "arigatou gozaimasu", english: "Thank you" },
    { japanese: "わかりません", romaji: "wakarimasen", english: "I don't understand" },
    { japanese: "もう一度お願いします", romaji: "mou ichido onegaishimasu", english: "Please say it again" },
    { japanese: "はい、そうです", romaji: "hai, sou desu", english: "Yes, that's right" },
    { japanese: "いいえ、違います", romaji: "iie, chigaimasu", english: "No, that's wrong" },
  ];

  const insertPhrase = (phrase: string) => {
    setMessage(prev => prev + (prev ? " " : "") + phrase);
    textareaRef.current?.focus();
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        {/* Quick phrase suggestions */}
        <div className="chat-input-suggestions">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickPhrases.slice(0, 3).map((phrase, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => insertPhrase(phrase.japanese)}
                className="text-xs h-6 px-2"
                title={`${phrase.romaji} - ${phrase.english}`}
              >
                {phrase.japanese}
              </Button>
            ))}
          </div>
        </div>

        <div className="chat-input-field-container">
          <div className="chat-input-field">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="chat-textarea resize-none"
              rows={1}
              style={{ maxHeight: "120px" }}
            />
          </div>

          {/* Input controls */}
          <div className="flex items-center gap-2">
            {/* Furigana toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFurigana}
              className="text-muted-foreground hover:text-foreground"
              title={showFurigana ? "Hide Furigana" : "Show Furigana"}
            >
              {showFurigana ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

            {/* Input mode and conversion tools */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  title="Input Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Input Settings</h4>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="input-mode" className="text-sm">
                        Romaji Input Mode
                      </Label>
                      <Switch
                        id="input-mode"
                        checked={inputMode === 'romaji'}
                        onCheckedChange={(checked) => 
                          setInputMode(checked ? 'romaji' : 'normal')
                        }
                      />
                    </div>
                    
                    {inputMode === 'romaji' && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-convert" className="text-sm">
                          Auto-convert to Hiragana
                        </Label>
                        <Switch
                          id="auto-convert"
                          checked={autoConvert}
                          onCheckedChange={setAutoConvert}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label htmlFor="furigana-display" className="text-sm">
                        Show Furigana
                      </Label>
                      <Switch
                        id="furigana-display"
                        checked={showFurigana}
                        onCheckedChange={onToggleFurigana}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Text Conversion</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={convertToHiragana}
                        disabled={!message.trim()}
                      >
                        あ Hiragana
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={convertToKatakana}
                        disabled={!message.trim()}
                      >
                        ア Katakana
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={convertToRomaji}
                        disabled={!message.trim()}
                      >
                        Aa Romaji
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Quick Phrases</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {quickPhrases.map((phrase, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => insertPhrase(phrase.japanese)}
                          className="justify-start text-left h-auto py-2"
                          title={phrase.english}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{phrase.japanese}</span>
                            <span className="text-xs text-muted-foreground">
                              {phrase.romaji}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Send button */}
            <Button
              onClick={onSendMessage}
              disabled={!message.trim() || isLoading}
              className="chat-send-button"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Input mode indicator */}
      {inputMode === 'romaji' && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Keyboard className="w-3 h-3" />
          <span>
            Romaji input mode {autoConvert ? '(auto-converting)' : '(manual conversion)'}
          </span>
          {message && wanakana.isRomaji(message) && (
            <span className="text-blue-600">
              → {wanakana.toHiragana(message)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
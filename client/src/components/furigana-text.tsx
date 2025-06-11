
import { useMemo } from "react";
import InteractiveKanji from "@/components/interactive-kanji";

interface FuriganaTextProps {
  text: string;
  showFurigana?: boolean;
  className?: string;
}

export default function FuriganaText({ text, showFurigana = true, className = "" }: FuriganaTextProps) {
  const processedText = useMemo(() => {
    // Pattern to match kanji with furigana: 漢字(かんじ)
    const furiganaPattern = /([一-龯]+)\(([あ-ん]+)\)/g;
    
    const parts: Array<{ type: 'text' | 'furigana'; content: string; reading?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add the furigana match
      parts.push({
        type: 'furigana',
        content: match[1], // kanji
        reading: match[2]  // hiragana reading
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts;
  }, [text]);

  // Function to get meaning based on the kanji character
  const getMeaning = (kanji: string): string => {
    const meanings: Record<string, string> = {
      "日": "day; sun",
      "月": "month; moon",
      "人": "person; people",
      "大": "big; large",
      "小": "small; little",
      "中": "middle; inside",
      "上": "above; up",
      "下": "below; down",
      "前": "front; before",
      "後": "back; after",
      "左": "left",
      "右": "right",
      "手": "hand",
      "足": "foot; leg",
      "目": "eye",
      "口": "mouth",
      "耳": "ear",
      "水": "water",
      "火": "fire",
      "土": "earth; soil",
      "木": "tree; wood",
      "金": "gold; money",
      "学": "study; learning",
      "校": "school",
      "生": "life; student",
      "先": "before; teacher",
      "年": "year",
      "時": "time",
      "分": "minute; part",
      "秒": "second",
      "今": "now",
      "昨": "yesterday",
      "明": "tomorrow; bright",
      "来": "come; next",
      "行": "go; line",
      "見": "see; look",
      "聞": "hear; listen",
      "話": "speak; story",
      "読": "read",
      "書": "write",
      "食": "eat; food",
      "飲": "drink",
      "買": "buy",
      "売": "sell",
      "作": "make; create",
      "持": "hold; have",
      "取": "take; get",
      "出": "exit; come out",
      "入": "enter; put in",
      "立": "stand",
      "座": "sit",
      "歩": "walk",
      "走": "run",
      "泳": "swim",
      "寝": "sleep",
      "起": "wake up; get up",
      "働": "work",
      "勉": "study; effort",
      "強": "strong; force",
      "好": "like; good",
      "嫌": "dislike; hate",
      "新": "new",
      "古": "old",
      "高": "high; expensive",
      "安": "cheap; safe",
      "早": "early; fast",
      "遅": "late; slow",
      "多": "many; much",
      "少": "few; little",
      "長": "long; leader",
      "短": "short",
      "広": "wide; spacious",
      "狭": "narrow",
      "重": "heavy; important",
      "軽": "light; easy",
      "暑": "hot",
      "寒": "cold",
      "暖": "warm",
      "涼": "cool; refreshing",
      "明": "bright; clear",
      "暗": "dark",
      "静": "quiet; peaceful",
      "騒": "noisy; loud",
      "美": "beautiful",
      "汚": "dirty",
      "綺": "beautiful; pretty",
      "麗": "beautiful; lovely",
      "元": "origin; energy",
      "気": "spirit; energy",
      "心": "heart; mind",
      "体": "body",
      "頭": "head",
      "顔": "face",
      "髪": "hair",
      "声": "voice",
      "名": "name",
      "字": "character; letter",
      "言": "say; word",
      "語": "language; word",
      "国": "country",
      "家": "house; family",
      "町": "town",
      "市": "city",
      "県": "prefecture",
      "駅": "station",
      "電": "electricity",
      "車": "car; vehicle",
      "道": "road; way",
      "橋": "bridge",
      "店": "shop; store",
      "銀": "silver; bank",
      "病": "illness; disease",
      "院": "institution",
      "公": "public",
      "園": "garden; park",
      "図": "diagram; map",
      "館": "building; hall",
      "映": "reflect; movie",
      "画": "picture; painting",
      "音": "sound",
      "楽": "music; fun",
      "歌": "song; sing",
      "本": "book; origin",
      "雑": "miscellaneous",
      "誌": "magazine",
      "新": "new",
      "聞": "newspaper; hear",
      "料": "fee; material",
      "理": "reason; logic",
      "教": "teach; religion",
      "室": "room",
      "質": "quality; nature",
      "問": "question; problem",
      "答": "answer",
      "番": "number; turn",
      "号": "number; signal",
      "何": "what; how many",
      "誰": "who",
      "何": "what",
      "時": "when; time",
      "所": "place; location",
      "方": "direction; method",
      "色": "color",
      "白": "white",
      "黒": "black",
      "赤": "red",
      "青": "blue",
      "黄": "yellow",
      "緑": "green",
      "茶": "brown; tea",
      "紫": "purple",
      "桜": "cherry blossom",
      "花": "flower",
      "春": "spring",
      "夏": "summer",
      "秋": "autumn",
      "冬": "winter",
      "雨": "rain",
      "雪": "snow",
      "風": "wind",
      "雲": "cloud",
      "空": "sky; empty",
      "海": "sea; ocean",
      "山": "mountain",
      "川": "river",
      "森": "forest",
      "田": "rice field",
      "畑": "farm field",
      "動": "move; motion",
      "物": "thing; object",
      "鳥": "bird",
      "魚": "fish",
      "犬": "dog",
      "猫": "cat",
      "馬": "horse",
      "牛": "cow",
      "豚": "pig",
      "鶏": "chicken",
      "虫": "insect; bug",
      "草": "grass",
      "薬": "medicine; drug",
      "病": "illness; sick",
      "怪": "injury; wound",
      "痛": "pain; hurt",
      "熱": "fever; heat",
      "風": "cold; wind",
      "邪": "evil; illness",
      "医": "doctor; medicine",
      "者": "person; -er",
      "看": "look; watch",
      "護": "protect; care",
      "師": "teacher; master",
      "警": "police; warn",
      "察": "police; investigate",
      "消": "extinguish; erase",
      "防": "prevent; defend",
      "士": "warrior; person",
      "運": "carry; luck",
      "転": "turn; roll",
      "手": "driver; hand",
      "客": "customer; guest",
      "主": "main; owner",
      "社": "company; society",
      "員": "member; staff",
      "会": "meeting; society",
      "議": "discussion; meeting",
      "事": "thing; matter",
      "仕": "serve; work",
      "業": "business; work",
      "職": "job; occupation",
      "給": "salary; supply",
      "料": "fee; charge",
      "税": "tax",
      "金": "money; gold",
      "円": "yen; circle",
      "万": "ten thousand",
      "千": "thousand",
      "百": "hundred",
      "十": "ten",
      "一": "one",
      "二": "two",
      "三": "three",
      "四": "four",
      "五": "five",
      "六": "six",
      "七": "seven",
      "八": "eight",
      "九": "nine",
      "零": "zero"
    };
    
    return meanings[kanji] || "Click for definition";
  };

  return (
    <span className={`font-japanese ${className}`}>
      {processedText.map((part, index) => {
        if (part.type === 'furigana') {
          return (
            <span key={index} className="relative inline-block">
              {showFurigana && (
                <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full text-lantern-orange/60 text-xs whitespace-nowrap pointer-events-none">
                  {part.reading}
                </span>
              )}
              <InteractiveKanji 
                kanji={part.content}
                reading={part.reading || ''}
                meaning={getMeaning(part.content)}
                className="hover:text-lantern-orange transition-colors"
              />
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}

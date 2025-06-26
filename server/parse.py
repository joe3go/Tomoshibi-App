#!/usr/bin/env python3
"""
Japanese text parsing server using fugashi and pykakasi
Provides endpoints for tokenizing Japanese text and word definitions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import fugashi
import pykakasi
import requests
import os
import logging
from typing import List, Dict, Optional

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Japanese text processors
try:
    # Initialize MeCab with fugashi for morphological analysis
    tagger = fugashi.Tagger()
    logger.info("✅ Fugashi MeCab tagger initialized")
    
    # Initialize pykakasi for kana conversion and furigana
    kks = pykakasi.kakasi()
    kks.setMode('H', 'a')  # Hiragana to ascii
    kks.setMode('K', 'a')  # Katakana to ascii  
    kks.setMode('J', 'a')  # Japanese to ascii
    conv = kks.getConverter()
    logger.info("✅ Pykakasi converter initialized")
    
except Exception as e:
    logger.error(f"❌ Failed to initialize Japanese processors: {e}")
    tagger = None
    conv = None

# Jisho API configuration
JISHO_API_BASE = "https://jisho.org/api/v1/search/words"

class JapaneseParser:
    """Enhanced Japanese text parser using fugashi and pykakasi"""
    
    def __init__(self):
        self.tagger = tagger
        self.converter = conv
        self.definition_cache = {}  # Simple in-memory cache
    
    def parse_text(self, text: str) -> List[Dict]:
        """Parse Japanese text into tokens with readings and metadata"""
        if not self.tagger or not text.strip():
            return [{"word": text, "reading": text, "base_form": text, "pos": "unknown"}]
        
        tokens = []
        
        try:
            for word in self.tagger(text):
                # Extract features from MeCab
                features = str(word.feature).split(',')
                
                # Get surface form (word as it appears)
                surface = word.surface
                
                # Get reading from features or use pykakasi as fallback
                reading = self._get_reading(surface, features)
                
                # Get base form (dictionary form)
                base_form = features[6] if len(features) > 6 and features[6] != '*' else surface
                
                # Get part of speech
                pos = features[0] if len(features) > 0 else "unknown"
                
                # Skip empty tokens
                if not surface.strip():
                    continue
                
                token = {
                    "word": surface,
                    "reading": reading,
                    "base_form": base_form,
                    "pos": self._simplify_pos(pos)
                }
                
                tokens.append(token)
                
        except Exception as e:
            logger.error(f"Error parsing text '{text}': {e}")
            # Fallback to character-by-character parsing
            return self._fallback_parse(text)
        
        return tokens
    
    def _get_reading(self, surface: str, features: List[str]) -> str:
        """Get reading for a word using MeCab features or pykakasi fallback"""
        # Try to get reading from MeCab features
        if len(features) > 7 and features[7] != '*':
            return features[7]  # katakana reading
        elif len(features) > 8 and features[8] != '*':
            return features[8]  # pronunciation
        
        # Fallback to pykakasi for reading generation
        if self.converter:
            try:
                # Convert to hiragana reading
                result = self.converter.do(surface)
                if result and result != surface:
                    return result
            except Exception as e:
                logger.warning(f"Pykakasi conversion failed for '{surface}': {e}")
        
        return surface  # Return original if no reading found
    
    def _simplify_pos(self, pos: str) -> str:
        """Simplify part of speech tags for frontend display"""
        pos_map = {
            "名詞": "noun",
            "動詞": "verb", 
            "形容詞": "adjective",
            "副詞": "adverb",
            "助詞": "particle",
            "助動詞": "auxiliary",
            "連体詞": "adnominal",
            "接続詞": "conjunction",
            "感動詞": "interjection",
            "記号": "symbol",
            "補助記号": "supplementary_symbol"
        }
        return pos_map.get(pos, pos.lower())
    
    def _fallback_parse(self, text: str) -> List[Dict]:
        """Fallback parsing when MeCab fails"""
        return [{
            "word": text,
            "reading": text,
            "base_form": text,
            "pos": "unknown"
        }]
    
    async def get_definition(self, word: str) -> Optional[Dict]:
        """Get word definition from Jisho API with caching"""
        # Check cache first
        if word in self.definition_cache:
            logger.info(f"📋 Cache hit for word: {word}")
            return self.definition_cache[word]
        
        try:
            # Query Jisho API
            params = {"keyword": word}
            response = requests.get(JISHO_API_BASE, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get("data"):
                logger.warning(f"No definition found for word: {word}")
                return None
            
            # Extract first result
            first_result = data["data"][0]
            japanese = first_result.get("japanese", [{}])[0]
            senses = first_result.get("senses", [])
            
            definition = {
                "word": japanese.get("word", word),
                "reading": japanese.get("reading", ""),
                "meanings": [sense.get("english_definitions", []) for sense in senses[:3]],
                "pos": [sense.get("parts_of_speech", []) for sense in senses[:2]],
                "jlpt_level": self._extract_jlpt_level(first_result),
                "examples": []
            }
            
            # Flatten meanings and POS
            definition["meanings"] = [meaning for sublist in definition["meanings"] for meaning in sublist]
            definition["pos"] = [pos for sublist in definition["pos"] for pos in sublist]
            
            # Cache the result
            self.definition_cache[word] = definition
            logger.info(f"✅ Definition cached for word: {word}")
            
            return definition
            
        except Exception as e:
            logger.error(f"❌ Error fetching definition for '{word}': {e}")
            return None
    
    def _extract_jlpt_level(self, result: Dict) -> Optional[int]:
        """Extract JLPT level from Jisho result"""
        jlpt_tags = result.get("jlpt", [])
        if jlpt_tags:
            # Extract number from tags like "jlpt-n5"
            for tag in jlpt_tags:
                if tag.startswith("jlpt-n"):
                    try:
                        return int(tag.split("-n")[1])
                    except (IndexError, ValueError):
                        pass
        return None

# Initialize parser
parser = JapaneseParser()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "fugashi_available": tagger is not None,
        "pykakasi_available": conv is not None
    })

@app.route('/parse-japanese', methods=['POST'])
def parse_japanese():
    """Parse Japanese text into tokens with readings"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' parameter"}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({"error": "Empty text provided"}), 400
        
        logger.info(f"🔍 Parsing text: {text[:50]}...")
        
        # Parse text into tokens
        tokens = parser.parse_text(text)
        
        logger.info(f"✅ Parsed {len(tokens)} tokens")
        return jsonify(tokens)
        
    except Exception as e:
        logger.error(f"❌ Error in parse_japanese: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/definition', methods=['GET'])
def get_definition():
    """Get word definition from Jisho API"""
    try:
        word = request.args.get('word')
        if not word:
            return jsonify({"error": "Missing 'word' parameter"}), 400
        
        logger.info(f"📖 Looking up definition for: {word}")
        
        # Get definition (this is sync, but could be made async)
        import asyncio
        definition = asyncio.run(parser.get_definition(word))
        
        if definition:
            return jsonify(definition)
        else:
            return jsonify({"error": "Definition not found"}), 404
            
    except Exception as e:
        logger.error(f"❌ Error in get_definition: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Test endpoint for development"""
    sample_text = "今日は良い天気ですね。"
    tokens = parser.parse_text(sample_text)
    return jsonify({
        "sample_text": sample_text,
        "tokens": tokens,
        "parser_status": {
            "fugashi": tagger is not None,
            "pykakasi": conv is not None
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
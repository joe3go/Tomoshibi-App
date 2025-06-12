import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import { generateAIResponse, generateScenarioIntroduction } from "./openai";
import { insertUserSchema, insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { openai, detectAndTranslateEnglish } from './openai';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure multer for file uploads
const storage_multer = multer.memoryStorage();
const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.') as any, false);
    }
  }
});

interface AuthRequest extends Request {
  userId?: number;
}

// Middleware to verify JWT token
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Vocabulary tracking function
async function trackVocabularyFromMessage(userId: number, content: string, source: 'user' | 'ai'): Promise<void> {
  try {
    // Extract Japanese words (hiragana, katakana, kanji)
    const japaneseWords = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g) || [];

    for (const word of japaneseWords) {
      if (word.length >= 2) { // Only track words of 2+ characters
        // Try to find the word in our vocabulary database
        const vocabMatches = await storage.searchVocab(word);
        if (vocabMatches.length > 0) {
          const vocabWord = vocabMatches[0];
          await storage.incrementWordFrequency(userId, vocabWord.id, source);
        }
      }
    }
  } catch (error) {
    console.error('Vocabulary tracking error:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, displayName, password } = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: passwordHash, // Use hashed password
        displayName,
        preferredKanjiDisplay: 'furigana',
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          preferredKanjiDisplay: user.preferredKanjiDisplay,
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          preferredKanjiDisplay: user.preferredKanjiDisplay,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
        preferredKanjiDisplay: user.preferredKanjiDisplay,
        soundNotifications: user.soundNotifications,
        desktopNotifications: user.desktopNotifications,
      });
    } catch (error) {
      console.error('Auth me error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.patch('/api/users/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId) || userId !== req.userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const updates = req.body;

      // If password is being updated, hash it
      if (updates.password) {
        updates.passwordHash = await bcrypt.hash(updates.password, 10);
        delete updates.password;
      }

      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Avatar upload endpoint
  app.post('/api/upload/avatar', authenticateToken, upload.single('avatar'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Convert buffer to base64 data URL
      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const profileImageUrl = `data:${mimeType};base64,${base64Data}`;

      // Update user with new profile image
      await storage.updateUser(req.userId!, { profileImageUrl });

      res.json({ profileImageUrl });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: 'Failed to upload avatar' });
    }
  });

  // Persona routes
  app.get('/api/personas', authenticateToken, async (req, res) => {
    try {
      const personas = await storage.getAllPersonas();
      res.json(personas);
    } catch (error) {
      console.error('Get personas error:', error);
      res.status(500).json({ message: 'Failed to get personas' });
    }
  });

  // Scenario routes
  app.get('/api/scenarios', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const scenarios = await storage.getUnlockedScenarios(req.userId!);
      res.json(scenarios);
    } catch (error) {
      console.error('Get scenarios error:', error);
      res.status(500).json({ message: 'Failed to get scenarios' });
    }
  });

  // Conversation routes
  app.post('/api/conversations', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversationData = insertConversationSchema.parse({
        ...req.body,
        userId: req.userId,
      });

      const conversation = await storage.createConversation(conversationData);

      // Generate initial AI message
      const persona = await storage.getPersona(conversation.personaId!);
      const scenario = await storage.getScenario(conversation.scenarioId!);

      if (persona && scenario) {
        const introduction = await generateScenarioIntroduction(persona, scenario);

        await storage.createMessage({
          conversationId: conversation.id,
          sender: 'ai',
          content: introduction,
        });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(400).json({ message: 'Failed to create conversation' });
    }
  });

  app.get('/api/conversations/completed', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversations = await storage.getUserConversations(req.userId!);
      // Only return completed conversations for transcripts
      const completedConversations = conversations.filter(c => c.status === 'completed');
      res.json(completedConversations);
    } catch (error) {
      console.error('Get completed conversations error:', error);
      res.status(500).json({ message: 'Failed to get completed conversations' });
    }
  });

  app.get('/api/conversations/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      const conversation = await storage.getConversation(conversationId);

      if (!conversation || conversation.userId !== req.userId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const messages = await storage.getConversationMessages(conversationId);

      res.json({ conversation, messages });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to get conversation' });
    }
  });

  app.get('/api/conversations', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversations = await storage.getUserConversations(req.userId!);
      // Filter for active conversations only (not completed)
      const activeConversations = conversations.filter(c => c.status !== 'completed');
      res.json(activeConversations);
    } catch (error) {
      console.error('Get user conversations error:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  app.patch('/api/conversations/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      const updates = req.body;

      // Convert ISO string to Date object for timestamp fields
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }

      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== req.userId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const updatedConversation = await storage.updateConversation(conversationId, updates);
      res.json(updatedConversation);
    } catch (error) {
      console.error('Update conversation error:', error);
      res.status(500).json({ message: 'Failed to update conversation' });
    }
  });

  // Message routes
  app.post('/api/conversations/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      console.log(`[CHAT] User ${req.userId} sending message to conversation ${conversationId}`);
      console.log(`[CHAT] Message content: "${content}"`);

      if (!content?.trim()) {
        console.error(`[CHAT ERROR] Empty message content from user ${req.userId}`);
        return res.status(400).json({ message: 'Message content is required' });
      }

      // Detect and translate English content to Japanese
      console.log(`[CHAT] Detecting/translating English for conversation ${conversationId}`);
      const translationResult = await detectAndTranslateEnglish(content.trim());
      console.log(`[CHAT] Translation result:`, translationResult.translations.length > 0 ? 'Found translations' : 'No translations needed');

      // Create user message with original content
      console.log(`[CHAT] Creating user message in conversation ${conversationId}`);
      const userMessage = await storage.createMessage({
        conversationId,
        sender: 'user',
        content: content.trim()
      });
      console.log(`[CHAT] User message created with ID: ${userMessage.id}`);

      // Process vocabulary from both original message and translations
      console.log(`[CHAT] Tracking vocabulary for user ${req.userId}`);
      await trackVocabularyFromMessage(req.userId!, content, 'user');

      // If we have translations, also track the Japanese vocabulary
      if (translationResult.translations.length > 0) {
        for (const trans of translationResult.translations) {
          // Try to find the Japanese word in our vocabulary database
          const vocab = await storage.getAllVocab();
          const matchingVocab = vocab.find(v => 
            v.kanji === trans.japanese || 
            v.hiragana === trans.hiragana ||
            v.englishMeaning.toLowerCase().includes(trans.english.toLowerCase())
          );

          if (matchingVocab) {
            await storage.incrementWordFrequency(req.userId!, matchingVocab.id, 'user');
          }
        }
      }

      // Get conversation context for AI response
      console.log(`[CHAT] Getting conversation context for ${conversationId}`);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.error(`[CHAT ERROR] Conversation ${conversationId} not found`);
        return res.status(404).json({ message: 'Conversation not found' });
      }

      console.log(`[CHAT] Loading persona ${conversation.personaId} and scenario ${conversation.scenarioId}`);
      const persona = await storage.getPersona(conversation.personaId!);
      const scenario = conversation.scenarioId ? await storage.getScenario(conversation.scenarioId) : null;
      const messages = await storage.getConversationMessages(conversationId);
      const targetVocab = await storage.getAllVocab(); // Simplified - should filter by scenario
      const targetGrammar = await storage.getAllGrammar(); // Simplified - should filter by scenario

      console.log(`[CHAT] Context loaded - Messages: ${messages.length}, Vocab: ${targetVocab.length}, Grammar: ${targetGrammar.length}`);

      // Generate AI response using enhanced message if translations were found
      const systemPrompt = persona?.systemPrompt || "You are a helpful Japanese language tutor.";
      const contextPrompt = scenario ? `\n\nScenario context: ${scenario.description}` : '';

      // Include translation context in system prompt if translations were made
      const translationContext = translationResult.translations.length > 0 
        ? `\n\nNote: The user included English words that translate to: ${translationResult.translations.map(t => `${t.english} → ${t.japanese} (${t.hiragana})`).join(', ')}. You may reference these translations in your response.`
        : '';

      const chatMessages = messages.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      console.log(`[CHAT] Generating AI response for conversation ${conversationId}`);
      const aiResponse = await generateAIResponse({
        persona,
        scenario,
        conversationHistory: chatMessages,
        userMessage: content,
        targetVocab: targetVocab.slice(0, 20), // Limit for context
        targetGrammar: targetGrammar.slice(0, 10), // Limit for context,
        translationContext
      });
      console.log(`[CHAT] AI response generated successfully`);

      // Create AI message
      console.log(`[CHAT] Creating AI message in conversation ${conversationId}`);
      const aiMessage = await storage.createMessage({
        conversationId,
        sender: 'ai',
        content: aiResponse.content,
        feedback: aiResponse.feedback,
        vocabUsed: aiResponse.vocabUsed || [],
        grammarUsed: aiResponse.grammarUsed || [],
      });
      console.log(`[CHAT] AI message created with ID: ${aiMessage.id}`);

      // Process vocabulary from AI message
      console.log(`[CHAT] Tracking vocabulary from AI response`);
      await trackVocabularyFromMessage(req.userId!, aiResponse.content, 'ai');

      // Return both messages with translation info if available
      console.log(`[CHAT] Getting updated messages for response`);
      const updatedMessages = await storage.getConversationMessages(conversationId);
      const responseData = {
        messages: updatedMessages,
        translations: translationResult.translations.length > 0 ? translationResult.translations : undefined
      };

      console.log(`[CHAT] Successfully processed message for conversation ${conversationId}`);
      res.json(responseData);

    } catch (error) {
      console.error(`[CHAT ERROR] Failed to send message for conversation ${req.params.id}:`, error);
      console.error(`[CHAT ERROR] Error stack:`, error instanceof Error ? error.stack : 'No stack trace available');
      console.error(`[CHAT ERROR] User ID: ${req.userId}, Content: "${req.body?.content}"`);
      res.status(500).json({ message: 'Failed to send message', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Vocabulary routes
  app.get('/api/vocab', authenticateToken, async (req, res) => {
    try {
      const vocab = await storage.getAllVocab();
      res.json(vocab);
    } catch (error) {
      console.error('Get vocab error:', error);
      res.status(500).json({ message: 'Failed to get vocabulary' });
    }
  });

  app.get('/api/vocab/search', authenticateToken, async (req, res) => {
    try {
      const { q } = req.query;
      const vocab = await storage.searchVocab(q as string || '');
      res.json(vocab);
    } catch (error) {
      console.error('Search vocab error:', error);
      res.status(500).json({ message: 'Failed to search vocabulary' });
    }
  });

  // Vocabulary tracker routes
  app.get('/api/vocab-tracker', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const trackerData = await storage.getUserVocabTracker(req.userId!);
      res.json(trackerData);
    } catch (error) {
      console.error('Get vocab tracker error:', error);
      res.status(500).json({ message: 'Failed to get vocabulary tracker' });
    }
  });

  app.post('/api/vocab-tracker/increment', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { wordId, source = 'hover' } = req.body;
      if (!wordId) {
        return res.status(400).json({ message: 'Word ID is required' });
      }

      const tracker = await storage.incrementWordFrequency(req.userId!, wordId, source);
      res.json(tracker);
    } catch (error) {
      console.error('Increment word frequency error:', error);
      res.status(500).json({ message: 'Failed to increment word frequency' });
    }
  });

  app.get('/api/word-definition/:word', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { word } = req.params;

      // First check our local vocabulary database
      const localVocab = await storage.searchVocab(word);
      if (localVocab.length > 0) {
        const vocabItem = localVocab[0];
        return res.json({
          word: vocabItem.kanji || vocabItem.hiragana,
          reading: vocabItem.hiragana,
          meaning: vocabItem.englishMeaning,
          jlptLevel: vocabItem.jlptLevel,
          wordType: vocabItem.wordType,
          source: 'local'
        });
      }

      // If not found locally, try Jisho.org API (reliable external source)
      try {
        console.log(`Fetching definition for word: ${word}`);
        const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Tomoshibi-App/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Jisho API response status: ${response.status}`);

          if (data.data && data.data.length > 0) {
            const entry = data.data[0];
            const japanese = entry.japanese && entry.japanese[0] ? entry.japanese[0] : {};
            const sense = entry.senses && entry.senses[0] ? entry.senses[0] : {};

            return res.json({
              word: japanese.word || japanese.reading || word,
              reading: japanese.reading || word,
              meaning: sense.english_definitions ? sense.english_definitions.join(', ') : 'Definition not available',
              wordType: sense.parts_of_speech ? sense.parts_of_speech.join(', ') : 'Unknown',
              source: 'external'
            });
          }
        }

        console.log(`No definition found for word: ${word}, status: ${response.status}`);
        res.status(404).json({ message: 'Definition not found' });
      } catch (apiError) {
        console.error('External API error:', apiError);
        res.status(404).json({ message: 'Definition not found' });
      }
    } catch (error) {
      console.error('Get word definition error:', error);
      res.status(500).json({ message: 'Failed to get word definition' });
    }
  });

  // Progress routes
  app.get('/api/progress', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const progress = await storage.getUserProgress(req.userId!);
      if (!progress) {
        // Create initial progress record
        const newProgress = await storage.updateUserProgress(req.userId!, {
          jlptLevel: 'N5',
          vocabEncountered: [],
          vocabMastered: [],
          grammarEncountered: [],
          grammarMastered: [],
          totalConversations: 0,
          totalMessagesSent: 0,
        });
        return res.json(newProgress);
      }
      res.json(progress);
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ message: 'Failed to get progress' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
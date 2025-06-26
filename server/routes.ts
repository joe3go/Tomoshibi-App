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
import { insertUserSchema, insertConversationSchema, insertMessageSchema, usageLog } from "../shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { uuidToInt } from "./uuid-mapping";
import { logError, logInfo, logDebug } from "@utils/logger";
import { generateUUID } from "@utils/uuid";
import { safeJSONParse, safeJSONStringify } from "@utils/json";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

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
  userId?: string;
}

// Middleware to verify JWT token (supports both custom JWT and Supabase tokens)
const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // First try to verify as custom JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.userId || decoded.userUuid;
      return next();
    } catch (jwtError) {
      console.log('Custom JWT verification failed, trying Supabase token...');
    }

    // If custom JWT fails, try Supabase token verification
    const config = getSupabaseConfig();
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(config.url, config.serviceKey);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase token verification error:', error);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.userId = user.id;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Environment-specific Supabase configuration
const getSupabaseConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return {
      url: process.env.VITE_SUPABASE_DEV_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co',
      serviceKey: process.env.VITE_SUPABASE_DEV_SERVICE_KEY || ''
    };
  } else {
    return {
      url: process.env.VITE_SUPABASE_PROD_URL || 'https://gsnnydemkpllycgzmalv.supabase.co',
      serviceKey: process.env.VITE_SUPABASE_PROD_SERVICE_KEY || ''
    };
  }
};

// Vocabulary tracking function (enhanced client-side tracking will be handled by VocabPopup)
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
  // Personas route - Remove authentication requirement for public tutor data
  app.get('/api/personas', async (req, res) => {
    try {
      // Use direct Supabase configuration that works
      const supabaseUrl = process.env.VITE_SUPABASE_DEV_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co';
      const serviceKey = process.env.VITE_SUPABASE_DEV_ANON_KEY;

      const { createClient } = await import('@supabase/supabase-js');
      if (!serviceKey) {
        console.error('❌ Missing Supabase service key');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const supabase = createClient(supabaseUrl, serviceKey);

      console.log('🔍 Fetching personas from Supabase...');

      // Try RPC function first
      try {
        console.log('🎯 Calling get_personas RPC function...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_personas');

        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          console.log('✅ RPC function successful, personas:', rpcData.length);
          return res.json(rpcData);
        }

        if (rpcError) {
          console.log('⚠️ RPC function error, falling back to direct query:', rpcError.message);
        }
      } catch (rpcError) {
        console.log('⚠️ RPC function not available, falling back to direct query...');
      }

      // Fallback to direct table query with explicit column selection
      const { data: personas, error } = await supabase
        .from('personas')
        .select(`
          id,
          name,
          type,
          description,
          personality,
          speaking_style,
          tone,
          level,
          origin,
          quirks,
          correction_style,
          language_policy,
          system_prompt_hint,
          avatar_url,
          bubble_class,
          created_at
        `)
        .order('id', { ascending: true });

      if (error) {
        console.error('❌ Error fetching personas:', error);
        return res.status(500).json({ 
          message: 'Failed to fetch personas from database',
          error: error.message 
        });
      }

      console.log('✅ Successfully fetched', personas?.length || 0, 'personas from direct query');

      if (personas && personas.length > 0) {
        console.log('📋 Available tutors:', personas.map(p => `${p.name} (${p.type})`).join(', '));
      }

      res.json(personas || []);
    } catch (error) {
      console.error('Error in personas endpoint:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, displayName, password } = insertUserSchema.parse(req.body);

      // Create user with Supabase Auth
      const user = await storage.createUser({
        email,
        password, // Supabase handles password hashing
        displayName,
        preferredKanjiDisplay: 'furigana',
      });

      // Generate JWT token with string user ID (Supabase uses UUIDs)
      const token = jwt.sign({ userId: user.id, userUuid: user.id }, JWT_SECRET, { expiresIn: '7d' });

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
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Use environment-specific Supabase configuration  
      const isDevelopment = process.env.NODE_ENV === 'development';
      const config = {
        url: isDevelopment ? 'https://gsnnydemkpllycgzmalv.supabase.co' : 'https://oyawpeylvdqfkhysnjsq.supabase.co',
        key: isDevelopment ? process.env.VITE_SUPABASE_DEV_SERVICE_KEY : process.env.VITE_SUPABASE_PROD_SERVICE_KEY
      };
      console.log('🔧 Login Environment:', isDevelopment ? 'development' : 'production');
      console.log('🔧 Login using Supabase URL:', config.url);

      if (!config.url || !config.key) {
        console.error('❌ Supabase configuration missing:', { url: !!config.url, key: !!config.key });
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(config.url, config.serviceKey);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!data.user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token with string user ID (Supabase uses UUIDs)
      const token = jwt.sign({ userId: data.user.id, userUuid: data.user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: data.user.id, // Keep as string UUID
          email: data.user.email,
          displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || '',
          preferredKanjiDisplay: data.user.user_metadata?.preferred_kanji_display || 'furigana',
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

  // Token verification endpoint
  app.get('/api/auth/verify', async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ valid: false, message: 'No token provided' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await storage.getUser(decoded.userId || decoded.userUuid);

      if (!user) {
        return res.status(401).json({ valid: false, message: 'User not found' });
      }

      res.json({ valid: true, user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ valid: false, message: 'Invalid token' });
    }
  });

  // Add endpoint to handle auth confirmation
  app.get('/auth/confirm', async (req, res) => {
    try {
      const { token_hash, type } = req.query;

      if (token_hash && type) {
        const config = getSupabaseConfig();
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(config.url, config.serviceKey);

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token_hash as string,
          type: type as any,
        });

        if (error) {
          console.error('Email confirmation error:', error);
          return res.redirect('/login?error=confirmation_failed');
        }

        if (data.user) {
          // Generate JWT token for automatic login
          const token = jwt.sign({ userId: data.user.id, userUuid: data.user.id }, JWT_SECRET, { expiresIn: '7d' });

          // Redirect to dashboard with token - use current host instead of localhost
          const host = req.get('host') || 'localhost:5000';
          const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
          return res.redirect(`${protocol}://${host}/dashboard?token=${token}`);
        }
      }

      // If no token or confirmation failed, redirect to login
      res.redirect('/login');
    } catch (error) {
      console.error('Auth confirmation error:', error);
      res.redirect('/login?error=confirmation_failed');
    }
  });

  app.patch('/api/users/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      if (userId !== req.userId) {
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
      console.log('🔄 Creating conversation with raw body:', req.body);

      // Use direct Supabase client since we're working with UUIDs now
      const config = getSupabaseConfig();
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(config.url, config.serviceKey);

      const { personaId, scenarioId, title = 'New Conversation' } = req.body;
      const userId = req.userId;

      console.log('🎯 Extracted values:', { 
        personaId, 
        scenarioId, 
        userId,
        personaIdType: typeof personaId,
        scenarioIdType: typeof scenarioId,
        userIdType: typeof userId
      });

      if (!personaId) {
        console.error('❌ Missing personaId');
        return res.status(400).json({ message: 'personaId is required' });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(personaId)) {
        console.error('❌ Invalid persona UUID format:', personaId);
        return res.status(400).json({ message: 'Invalid persona ID format' });
      }

      if (scenarioId && !uuidRegex.test(scenarioId)) {
        console.error('❌ Invalid scenario UUID format:', scenarioId);
        return res.status(400).json({ message: 'Invalid scenario ID format' });
      }

      console.log('✅ UUID validation passed');

      // Create conversation directly with Supabase
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          scenario_id: scenarioId || null,
          title: title,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating conversation:', error);
        console.error('❌ Error details:', { 
          code: error.code, 
          message: error.message, 
          details: error.details,
          hint: error.hint
        });
        return res.status(400).json({ message: `Failed to create conversation: ${error.message}` });
      }

      console.log('✅ Conversation created:', conversation);

      // Add persona to conversation participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          persona_id: personaId,
          role: 'tutor',
          order_in_convo: 1
        });

      if (participantError) {
        console.error('Failed to add conversation participant:', participantError);
      }

      // Get persona for initial message
      const { data: persona } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single();

      if (persona) {
        // Create more natural, persona-specific introduction
        const personalizedIntros = {
          'Aoi': `こんにちは！私は${persona.name}先生です。日本語の勉強を一緒に頑張りましょう！今日は何を学びたいですか？`,
          'Keiko': `やあ！${persona.name}だよ。よろしく！今日は何について話そうか？`,
          'Ren': `こんにちは！${persona.name}です。日本語の練習、楽しくやりましょうね！`,
          'Yuki': `こんにちは。${persona.name}と申します。どうぞよろしくお願いします。`,
          'Satoshi': `おはよう！${persona.name}だ。今日も元気に日本語を勉強しよう！`,
          'Haruki': `こんにちは！${persona.name}です。一緒に日本語を楽しく学びましょう！`
        };

        const introduction = personalizedIntros[persona.name] || 
          `こんにちは！私は${persona.name}です。今日は何について話しましょうか？`;

        const englishTranslations = {
          'Aoi': `Hello! I'm Teacher ${persona.name}. Let's work hard on studying Japanese together! What would you like to learn today?`,
          'Keiko': `Hey! I'm ${persona.name}. Nice to meet you! What should we talk about today?`,
          'Ren': `Hello! I'm ${persona.name}. Let's make Japanese practice fun!`,
          'Yuki': `Hello. My name is ${persona.name}. Please treat me favorably.`,
          'Satoshi': `Good morning! I'm ${persona.name}. Let's study Japanese energetically today!`,
          'Haruki': `Hello! I'm ${persona.name}. Let's enjoy learning Japanese together!`
        };

        const englishTranslation = englishTranslations[persona.name] || 
          `Hello! I'm ${persona.name}. What would you like to talk about today?`;

        console.log('💬 Adding personalized initial message for:', persona.name);

        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_type: 'ai',
            sender_persona_id: personaId,
            content: introduction,
            english: englishTranslation,
            created_at: new Date().toISOString()
          });

        if (messageError) {
          console.error('Failed to add initial message:', messageError);
        } else {
          console.log('✅ Initial greeting message added successfully');
        }
      }

      console.log('✅ Conversation created successfully:', conversation.id);
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
      const conversationId = req.params.id;

      // Use direct Supabase client for UUID-based conversations
      const config = getSupabaseConfig();
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(config.url, config.serviceKey);

      // Get conversation directly from Supabase
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', req.userId)
        .single();

      if (convError || !conversation) {
        console.error('Conversation not found:', convError);
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Get messages for this conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        return res.status(500).json({ message: 'Failed to get messages' });
      }

      res.json({ conversation, messages: messages || [] });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to get conversation' });
    }
  });

  app.get('/api/conversations', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Get mapped user ID for UUID to integer conversion
      const userUUID = req.userId!;
      const conversations = await storage.getUserConversations(userUUID);
      // Return all conversations - let frontend filter as needed
      res.json(conversations);
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
      const conversationId = req.params.id; // Keep as UUID string
      const { content, sender_persona_id } = req.body;

      // Use direct Supabase client for UUID-based conversations
      const config = getSupabaseConfig();
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(config.url, config.serviceKey);

      // Verify conversation belongs to user
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', req.userId)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Use create_message_with_tracking RPC function for user message
      const { data: userMessage, error: userMsgError } = await supabase
        .rpc('create_message_with_tracking', {
          _conversation_id: conversationId,
          _sender_type: 'user',
          _content: content,
          _sender_persona_id: null, // User messages don't have persona
          _vocab_used: null,
          _grammar_used: null
        });

      if (userMsgError) {
        console.error('Error creating user message:', userMsgError);
        return res.status(400).json({ message: 'Failed to create message' });
      }

      // Check if this is a group conversation and get participants
      const isGroupConversation = conversation.mode === 'group';
      let aiPersonaId = conversation.persona_id; // Default for solo conversations

      if (isGroupConversation) {
        // Get conversation participants and template data for group conversations
        const [participantsResult, templateResult] = await Promise.all([
          supabase
            .from('conversation_participants')
            .select(`
              conversation_id,
              persona_id,
              role,
              order_in_convo,
              personas(*)
            `)
            .eq('conversation_id', conversationId)
            .eq('role', 'ai')
            .order('order_in_convo'),
          supabase
            .from('conversations')
            .select(`
              template_id,
              conversation_templates(group_prompt_suffix)
            `)
            .eq('id', conversationId)
            .single()
        ]);

        participants = participantsResult.data;
        const templateData = templateResult.data;

        if (participants && participants.length > 0) {
          // Get the last AI message to determine next speaker using round-robin
          const { data: lastAIMessage } = await supabase
            .from('messages')
            .select('sender_persona_id')
            .eq('conversation_id', conversationId)
            .eq('sender_type', 'ai')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Determine next AI speaker using round-robin
          function getNextAISpeaker(personas: any[], lastSpeakerId: string | null) {
            if (!lastSpeakerId) return personas[0];
            const index = personas.findIndex(p => p.persona_id === lastSpeakerId);
            return personas[(index + 1) % personas.length];
          }

          const nextSpeaker = getNextAISpeaker(participants, lastAIMessage?.sender_persona_id || null);
          aiPersonaId = nextSpeaker.persona_id;

          // Store group prompt suffix for OpenAI context
          groupPromptSuffix = templateData?.conversation_templates?.group_prompt_suffix || null;

          console.log('Selected next AI speaker for group conversation:', {
            personaId: aiPersonaId,
            personaName: nextSpeaker.personas?.name,
            lastSpeaker: lastAIMessage?.sender_persona_id,
            totalParticipants: participants.length,
            hasGroupSuffix: !!groupPromptSuffix
          });
        }
      }

      // Generate AI response if needed
      if (aiPersonaId) {
        // Generate AI response using the chat/secure endpoint for group context
        const { generateAIResponse } = await import('./openai');

        // Get recent conversation history
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('sender_type, content, sender_persona_id')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(12);

        const conversationHistory = (recentMessages || [])
          .reverse()
          .map((msg: any) => ({
            role: msg.sender_type === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }));

        // Get conversation template for topic and group prompt suffix
        let conversationTopic = 'general conversation';
        let groupPromptSuffix = undefined;

        if (conversation.template_id) {
          const { data: template } = await supabase
            .from('conversation_templates')
            .select('title, group_prompt_suffix')
            .eq('id', conversation.template_id)
            .single();

          if (template) {
            conversationTopic = template.title;
            groupPromptSuffix = template.group_prompt_suffix;
          }
        }

        // For group conversations, implement smart round-robin speaker selection
        let selectedPersonaId = aiPersonaId;
        if (isGroupConversation && participants && participants.length > 1) {
          // Find the last AI message to determine next speaker
          const lastAIMessage = recentMessages?.find(msg => msg.sender_type === 'ai' && msg.sender_persona_id);

          if (!lastAIMessage?.sender_persona_id) {
            // No previous AI speaker, use first participant
            selectedPersonaId = participants[0].persona_id;
          } else {
            // Find current speaker and get next one (round-robin)
            const currentIndex = participants.findIndex(p => p.persona_id === lastAIMessage.sender_persona_id);
            if (currentIndex >= 0) {
              const nextIndex = (currentIndex + 1) % participants.length;
              selectedPersonaId = participants[nextIndex].persona_id;
            } else {
              // Fallback if persona not found in participants
              selectedPersonaId = participants[0].persona_id;
            }
          }

          console.log('🎭 Group conversation AI selection:', {
            selectedPersona: participants.find(p => p.persona_id === selectedPersonaId)?.personas?.name || 'Unknown',
            personaId: selectedPersonaId,
            totalParticipants: participants.length,
            lastSpeaker: lastAIMessage?.sender_persona_id || 'None'
          });
        }

        // Get persona for system prompt
        const { data: personaData } = await supabase
          .from('personas').select('*')
          ```text
.eq('id', selectedPersonaId)
          .single();

        if (!personaData) {
          throw new Error('Persona not found');
        }

        // Generate AI response with group context
        const aiResponse = await generateAIResponse({
          persona: personaData,
          conversationHistory,
          userMessage: content,
          targetVocab: [],
          targetGrammar: [],
          isGroupConversation,
          allPersonas: participants?.map(p => p.personas).filter(Boolean) || undefined,
          groupPromptSuffix,
          conversationTopic
        });

        // Create AI message using RPC with proper persona attribution
        const { data: aiMessage, error: aiMsgError } = await supabase
          .rpc('create_message_with_tracking', {
            p_conversation_id: conversationId,
            p_sender_type: 'ai',
            p_content: aiResponse.content,
            p_english_translation: aiResponse.english_translation || null,
            p_tutor_feedback: aiResponse.feedback || null,
            p_suggestions: Array.isArray(aiResponse.suggestions) ? aiResponse.suggestions : null,
            p_vocab_used: null,
            p_grammar_used: null,
            p_sender_persona_id: selectedPersonaId,
            p_user_id: req.userId
          });

        if (aiMsgError) {
          console.error('Error creating AI message:', aiMsgError);
          return res.status(500).json({ message: 'Failed to create AI response' });
        }

        console.log('✅ AI message created successfully with persona:', selectedPersonaId);

        // Return success response with message data
        res.json({ 
          userMessage: userMessage,
          aiMessage: aiMessage,
          success: true 
        });
        return;
      }

      // Return success for user message only
      res.json({ message: 'Message received successfully' });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Vocabulary routes
  app.get('/api/vocab', authenticateToken, async (req, res) => {
    try {
      const { level } = req.query;
      const vocab = level ? await storage.getVocabByLevel(level as string) : await storage.getAllVocab();
      res.json(vocab);
    } catch (error) {
      console.error('Get vocab error:', error);
      res.status(500).json({ message: 'Failed to get vocabulary' });
    }
  });

  app.get('/api/vocab/stats', authenticateToken, async (req, res) => {
    try {
      const config = getSupabaseConfig();
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(config.url, config.serviceKey);

      console.log('🔍 Fetching vocabulary statistics from Supabase using RPC...');

      // Try RPC function first
      try {
        console.log('🎯 Calling get_vocab_stats_by_level RPC function...');
        const { data, error } = await supabase.rpc('get_vocab_stats_by_level');

        if (error) throw error;

        if (data && Array.isArray(data) && data.length > 0) {
          console.log('✅ RPC function successful, data:', data);

          // Initialize with zeros for all levels
          const stats = { N1: 0, N2: 0, N3: 0, N4: 0, N5: 0 };

          // Update with actual data
          data.forEach(({ level, count }) => {
            if (level && ['N1', 'N2', 'N3', 'N4', 'N5'].includes(level)) {
              stats[level as keyof typeof stats] = Number(count) || 0;
            }
          });

          const result = Object.entries(stats).map(([level, count]) => ({
            level,
            count
          }));

          console.log('📊 Final vocab stats from RPC:', result);
          return res.json(result);
        } else {
          console.log('⚠️ RPC returned empty or invalid data:', data);
        }
      } catch (rpcError) {
        console.log('⚠️ RPC function not available, falling back to manual aggregation...');
        console.log('RPC Error:', rpcError.message);
      }

      // Fallback to manual aggregation using vocab_library
      const { data, error } = await supabase
        .from('vocab_library')
        .select('jlpt_level')
        .range(0, 19999);

      if (error) {
        console.error('❌ Supabase fallback query error:', error);
        console.log('🔄 Using hardcoded fallback counts...');
        return res.json([
          { level: 'N1', count: 2136 },
          { level: 'N2', count: 1651 },
          { level: 'N3', count: 1334 },
          { level: 'N4', count: 1022 },
          { level: 'N5', count: 721 }
        ]);
      }

      if (!data || data.length === 0) {
        console.log('📭 No vocabulary data found in Supabase');
        return res.json([
          { level: 'N1', count: 0 },
          { level: 'N2', count: 0 },
          { level: 'N3', count: 0 },
          { level: 'N4', count: 0 },
          { level: 'N5', count: 0 }
        ]);
      }

      console.log('✅ Successfully fetched', data.length, 'vocabulary entries from Supabase');

      // Count by level and map numeric levels to N-format
      const levelCounts = data.reduce((acc: Record<string, number>, item) => {
        const mappedLevel = typeof item.jlpt_level === 'number' 
          ? `N${item.jlpt_level}` 
          : item.jlpt_level.toString().startsWith('N') 
            ? item.jlpt_level 
            : `N${item.jlpt_level}`;

        acc[mappedLevel] = (acc[mappedLevel] || 0) + 1;
        return acc;
      }, {});

      const result = ['N1', 'N2', 'N3', 'N4', 'N5'].map(level => ({
        level,        count: levelCounts[level] || 0
      }));

      console.log('📊 Vocabulary counts by level (from Supabase manual aggregation):', result);
      res.json(result);
    } catch (error) {
      console.error('Get vocab stats error:', error);
      res.status(500).json({ message: 'Failed to get vocabulary statistics' });
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

  // New secure chat endpoint using dynamic prompts
  app.post('/api/chat/secure', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { tutorId, message, topic = 'general conversation', prefersEnglish = false, conversationId, groupTopic, groupContext, isGroupConversation, allParticipants } = req.body;
      const userId = req.userId!;

      const actualTopic = groupTopic || topic;

      logInfo('OpenAI chat request', {
        tutorId,
        conversationId,
        messageLength: message.length,
        hasGroupContext: !!groupTopic
      });

      if (!message) {
        return res.status(400).json({ message: 'Missing required field: message' });
      }

      // Import validation functions
      const { validateTutorId, getDefaultTutorId } = await import("@utils/validation");

      // Validate or use default tutorId
      let validTutorId: string;
      // Persona IDs are fixed UUIDs from Supabase, no validation needed
    console.log('🔍 Using tutor ID:', tutorId);

      validTutorId = tutorId

      // Get user info for context
      const config = getSupabaseConfig();
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(config.url, config.serviceKey);

      const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .single();

      const username = user?.display_name || 'Student';

      // Get recent conversation history (last 10 messages) - handle both UUID and integer IDs
      let recentMessages = [];
      if (conversationId) {
        const { data } = await supabase
          .from('messages')
          .select('sender, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(10);
        recentMessages = data || [];
      }

      const conversationHistory = recentMessages
        .reverse()
        .map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // Get persona data for AI response generation
      const { data: persona } = await supabase
        .from('personas')
        .select('*')
        .eq('id', validTutorId)
        .single();

      if (!persona) {
        console.error('❌ Persona not found for tutorId:', validTutorId);
        return res.status(400).json({ message: 'Tutor not found' });
      }

      // Create context for AI response generation
      const context: ConversationContext = {
        persona,
        scenario: null,
        conversationHistory,
        userMessage: message,
        targetVocab: [], 
        targetGrammar: [], 
        conversationTopic: actualTopic,
        groupPromptSuffix: groupContext,
        isGroupConversation: isGroupConversation || false,
        allPersonas: allParticipants || [],
      };

      // Generate AI response using enhanced context
      const { generateAIResponse } = await import('./openai');
      const aiResponse = await generateAIResponse(context);

      res.json({
        content: aiResponse.content,
        english_translation: aiResponse.english_translation,
        feedback: aiResponse.feedback,
        suggestions: aiResponse.suggestions,
        vocabUsed: aiResponse.vocabUsed || [],
        grammarUsed: aiResponse.grammarUsed || [],
        tutorId: validTutorId,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
    logError("Chat API Error:", error?.message || error);
    res.status(500).json({
      error: "Failed to generate response",
      details: error?.message || "Unknown error"
    });
  }
  });

  // Debug endpoint to check Supabase vocab counts
  app.get('/api/debug/vocab-counts', authenticateToken, async (req, res) => {
    try {
      console.log('Debug endpoint: Testing Supabase connection...');
      const supabaseStats = await storage.getVocabStats();

      // Also test direct Supabase connection
      const config = getSupabaseConfig();
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(config.url, config.serviceKey);

      const { data: directData, error: directError } = await supabase
        .from('vocab_library')
        .select('jlpt_level')
        .limit(5);

      res.json({
        message: "Vocabulary data now sourced from Supabase",
        totalWords: supabaseStats.reduce((sum, level) => sum + level.count, 0),
        byLevel: supabaseStats.reduce((acc, stat) => {
          acc[stat.level] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        source: "Supabase",
        supabaseStats,
        supabaseConnection: {
          url: config.url,
          environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
          directTestResult: directError ? directError.message : `Success - fetched ${directData?.length || 0} sample records`,
          directError: directError?.message || null
        }
      });
    } catch (error) {
      console.error('Debug vocab counts error:', error);
      res.status(500).json({ message: 'Failed to get debug vocab counts' });
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

  app.get('/api/vocab/user-stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getUserVocabStatsByLevel(req.userId!);
      res.json(stats);
    } catch (error) {
      console.error('Get user vocab stats error:', error);
      res.status(500).json({ message: 'Failed to get user vocabulary statistics' });
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
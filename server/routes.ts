import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { generateAIResponse, generateScenarioIntroduction } from "./openai";
import { insertUserSchema, insertConversationSchema, insertMessageSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

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
        preferredKanjiDisplay: user.preferredKanjiDisplay,
      });
    } catch (error) {
      console.error('Auth me error:', error);
      res.status(500).json({ message: 'Failed to get user' });
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

  app.get('/api/conversations/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversationId = parseInt(req.params.id);
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
      res.json(conversations);
    } catch (error) {
      console.error('Get user conversations error:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  // Message routes
  app.post('/api/conversations/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      
      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== req.userId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Create user message
      const userMessage = await storage.createMessage({
        conversationId,
        sender: 'user',
        content,
      });
      
      // Get context for AI response
      const persona = await storage.getPersona(conversation.personaId!);
      const scenario = await storage.getScenario(conversation.scenarioId!);
      const messages = await storage.getConversationMessages(conversationId);
      const targetVocab = await storage.getAllVocab(); // Simplified - should filter by scenario
      const targetGrammar = await storage.getAllGrammar(); // Simplified - should filter by scenario
      
      if (persona && scenario) {
        // Build conversation history
        const conversationHistory = messages
          .filter(m => m.id !== userMessage.id)
          .map(m => ({
            role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: m.content,
          }));
        
        // Generate AI response
        const aiResponse = await generateAIResponse({
          persona,
          scenario,
          conversationHistory,
          userMessage: content,
          targetVocab: targetVocab.slice(0, 20), // Limit for context
          targetGrammar: targetGrammar.slice(0, 10), // Limit for context
        });
        
        // Create AI message
        await storage.createMessage({
          conversationId,
          sender: 'ai',
          content: aiResponse.content,
          feedback: aiResponse.feedback,
          vocabUsed: aiResponse.vocabUsed,
          grammarUsed: aiResponse.grammarUsed,
        });
      }
      
      // Return updated messages
      const updatedMessages = await storage.getConversationMessages(conversationId);
      res.json(updatedMessages);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
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

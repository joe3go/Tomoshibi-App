import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  // Serve static files from dist/public in production
  const publicPath = path.resolve(process.cwd(), 'dist', 'public');
  
  if (fs.existsSync(publicPath)) {
    // Serve static assets
    app.use(express.static(publicPath));
    
    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      // Skip API routes and health checks
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      
      const indexPath = path.join(publicPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ error: 'Application not built properly' });
      }
    });
  } else {
    console.error(`Production build not found at: ${publicPath}`);
    // Fallback when build doesn't exist
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.status(503).json({ error: 'Application build not available', path: publicPath });
    });
  }
}
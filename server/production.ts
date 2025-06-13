import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  // Serve static files from dist/public in production
  const publicPath = path.resolve('dist/public');
  
  if (fs.existsSync(publicPath)) {
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
        res.status(404).send('Application not built');
      }
    });
  } else {
    // Fallback for development or when build doesn't exist
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.status(503).send('Application not ready');
    });
  }
}
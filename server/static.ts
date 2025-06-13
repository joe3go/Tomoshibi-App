import express from "express";
import path from "path";

export function serveStatic(app: express.Express) {
  const distPath = path.resolve(process.cwd(), "dist/public");
  
  // Serve static files from the dist/public directory
  app.use(express.static(distPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes and health check routes (already handled in routes.ts)
    if (req.path.startsWith("/api") || req.path.startsWith("/health") || req.path === "/") {
      return next();
    }
    
    const indexPath = path.join(distPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("Error serving index.html:", err);
        res.status(500).json({ message: "Failed to serve application" });
      }
    });
  });
}
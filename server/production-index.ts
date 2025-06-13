import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware for production
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[express] ${logLine}`);
    }
  });

  next();
});

(async () => {
  try {
    // Health check endpoints (must be before other routes)
    app.get('/', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'tomoshibi-app',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'tomoshibi-app',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production'
      });
    });

    const server = await registerRoutes(app);

    // Production: serve static files from dist/public
    serveStatic(app);

    const PORT = parseInt(process.env.PORT || "5000");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[express] Tomoshibi server started successfully on port ${PORT}`);
      console.log(`[express] Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`[express] Health check available at: http://0.0.0.0:${PORT}/health`);
    });
  } catch (error) {
    console.error("[express] Failed to start server:", error);
    process.exit(1);
  }
})();
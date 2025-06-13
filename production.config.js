// Production configuration for Tomoshibi deployment
export const productionConfig = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    environment: 'production',
    reusePort: true
  },

  // Health check configuration
  healthCheck: {
    enabled: true,
    endpoints: ['/', '/health'],
    timeout: 30000,
    retries: 3
  },

  // Static file serving
  static: {
    path: 'dist/public',
    maxAge: '1y',
    immutable: true,
    fallthrough: false
  },

  // Security headers
  security: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    }
  },

  // Logging configuration
  logging: {
    level: 'info',
    format: 'json',
    timestamp: true
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeout: 60000,
    idleTimeout: 30000
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  }
};

export default productionConfig;
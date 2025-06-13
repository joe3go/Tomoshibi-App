import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildServer() {
  try {
    console.log('Building server for production...');
    
    await build({
      entryPoints: [resolve(__dirname, 'server/production-index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: resolve(__dirname, 'dist/index.js'),
      external: [
        // Node.js built-in modules - comprehensive list
        'assert',
        'async_hooks',
        'buffer',
        'child_process',
        'cluster',
        'console',
        'constants',
        'crypto',
        'dgram',
        'dns',
        'domain',
        'events',
        'fs',
        'fs/promises',
        'http',
        'http2',
        'https',
        'inspector',
        'module',
        'net',
        'os',
        'path',
        'perf_hooks',
        'process',
        'punycode',
        'querystring',
        'readline',
        'repl',
        'stream',
        'string_decoder',
        'sys',
        'timers',
        'tls',
        'trace_events',
        'tty',
        'url',
        'util',
        'v8',
        'vm',
        'wasi',
        'worker_threads',
        'zlib',
        // Database drivers
        'pg-native',
        'better-sqlite3',
        'sqlite3',
        'mysql2',
        'mysql',
        'oracledb',
        'tedious',
        // Build tools and other externals
        'lightningcss',
        '@babel/preset-typescript',
        '@babel/core',
        'esbuild',
        'vite',
        'autoprefixer',
        'tailwindcss',
        'postcss',
        // Vite plugins (ES modules that cause issues in CJS)
        '@replit/vite-plugin-runtime-error-modal',
        '@replit/vite-plugin-cartographer',
        '@vitejs/plugin-react',
        '@tailwindcss/vite',
        // Additional common externals that might cause issues
        'fsevents',
        'canvas',
        'sharp'
      ],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      minify: true,
      sourcemap: true,
      logLevel: 'info',
      banner: {
        js: `
// CommonJS environment - __dirname and __filename are already available
        `
      },
      mainFields: ['main', 'module'],
      conditions: ['require', 'node', 'default'],
      packages: 'external'
    });
    
    console.log('Server build completed successfully!');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

buildServer();
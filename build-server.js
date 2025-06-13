import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildServer() {
  try {
    console.log('Building server for production...');
    
    await build({
      entryPoints: [resolve(__dirname, 'server/index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outfile: resolve(__dirname, 'dist/index.js'),
      external: [
        'pg-native',
        'better-sqlite3',
        'sqlite3',
        'mysql2',
        'mysql',
        'oracledb',
        'tedious',
        'lightningcss',
        '@babel/preset-typescript',
        '@babel/core',
        'esbuild',
        'vite',
        'autoprefixer',
        'tailwindcss',
        'postcss'
      ],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      minify: true,
      sourcemap: true,
      logLevel: 'info'
    });
    
    console.log('Server build completed successfully!');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

buildServer();
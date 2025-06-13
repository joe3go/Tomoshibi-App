import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runBuild() {
  try {
    console.log('Starting build process...');
    
    // Build client
    console.log('Building client...');
    execSync('vite build --outDir dist/public', { 
      stdio: 'inherit',
      cwd: resolve(__dirname, '..')
    });
    
    // Build server
    console.log('Building server...');
    execSync('node build-server.js', { 
      stdio: 'inherit',
      cwd: resolve(__dirname, '..')
    });
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();
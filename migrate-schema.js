import { execSync } from 'child_process';

try {
  // Run the database push without interactive prompts
  console.log('Migrating schema to Supabase...');
  execSync('echo "n" | npx drizzle-kit push', { stdio: 'inherit' });
  console.log('Schema migration completed successfully');
} catch (error) {
  console.error('Migration failed:', error.message);
}
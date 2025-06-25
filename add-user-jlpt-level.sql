-- Add jlpt_level column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS jlpt_level VARCHAR(3) DEFAULT 'N5' CHECK (jlpt_level IN ('N1', 'N2', 'N3', 'N4', 'N5'));

-- Update existing users to have default N5 level
UPDATE users 
SET jlpt_level = 'N5' 
WHERE jlpt_level IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_jlpt_level ON users(jlpt_level);

-- Verify the changes
SELECT id, email, display_name, jlpt_level 
FROM users 
LIMIT 5;
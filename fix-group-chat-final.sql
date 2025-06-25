
-- Fix all group chat database schema issues for Supabase

-- 1. Add missing difficulty column to conversation_templates
ALTER TABLE conversation_templates ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';

-- 2. Add missing group_prompt_suffix column if it doesn't exist
ALTER TABLE conversation_templates ADD COLUMN IF NOT EXISTS group_prompt_suffix TEXT;

-- 3. Clean up invalid conversation_participants (remove entries with non-existent persona IDs)
DELETE FROM conversation_participants 
WHERE persona_id NOT IN (SELECT id FROM personas);

-- 4. Get valid persona IDs and update conversation templates with correct default_personas
WITH valid_personas AS (
  SELECT id, name FROM personas WHERE name IN ('Aoi', 'Haruki', 'Keiko')
)
UPDATE conversation_templates 
SET default_personas = ARRAY(
  SELECT p.id::text 
  FROM valid_personas p 
  ORDER BY p.name
)
WHERE title IN ('Anime Club', 'Study Group', 'Cafe Hangout');

-- 5. Insert correct participants for group conversations
INSERT INTO conversation_participants (conversation_id, persona_id, role, order_in_convo)
SELECT c.id, p.id, 'ai', ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY p.name)
FROM conversations c
JOIN conversation_templates ct ON c.template_id = ct.id
CROSS JOIN personas p
WHERE ct.title IN ('Anime Club', 'Study Group', 'Cafe Hangout')
AND p.name IN ('Aoi', 'Haruki', 'Keiko')
AND c.mode = 'group'
ON CONFLICT (conversation_id, persona_id) DO NOTHING;

-- 6. Update group templates with proper prompt suffixes
UPDATE conversation_templates 
SET group_prompt_suffix = CASE 
  WHEN title = 'Anime Club' THEN 'You are part of an anime discussion group. Share your favorite shows, discuss characters, and help each other learn Japanese through anime culture. Keep responses short and natural for group discussion.'
  WHEN title = 'Study Group' THEN 'You are studying together for JLPT exams. Practice vocabulary, grammar, and encourage each other in your Japanese learning journey. Focus on helping with Japanese learning in a supportive group environment.'
  WHEN title = 'Cafe Hangout' THEN 'You are hanging out at a Japanese cafe. Have casual conversations about daily life, food, hobbies, and Japanese culture. Keep responses relaxed and friendly for casual chat.'
  ELSE 'This is a group conversation. Keep responses natural and engaging for multiple participants.'
END
WHERE title IN ('Anime Club', 'Study Group', 'Cafe Hangout');

-- 7. Verify the changes worked
SELECT 
  ct.title,
  ct.difficulty,
  ct.group_prompt_suffix,
  array_length(ct.default_personas, 1) as persona_count
FROM conversation_templates ct
WHERE ct.title IN ('Anime Club', 'Study Group', 'Cafe Hangout');

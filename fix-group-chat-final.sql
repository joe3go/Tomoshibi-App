-- Fix all group chat database schema issues

-- 1. Add missing difficulty column to conversation_templates
ALTER TABLE conversation_templates ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';

-- 2. Check and clean up invalid conversation_participants
DELETE FROM conversation_participants 
WHERE persona_id NOT IN (SELECT id FROM personas);

-- 3. Get valid persona IDs and update conversation templates
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

-- 4. Insert correct participants for group conversations
INSERT INTO conversation_participants (conversation_id, persona_id)
SELECT ct.id, p.id
FROM conversation_templates ct
CROSS JOIN personas p
WHERE ct.title IN ('Anime Club', 'Study Group', 'Cafe Hangout')
AND p.name IN ('Aoi', 'Haruki', 'Keiko')
ON CONFLICT (conversation_id, persona_id) DO NOTHING;

-- 5. Ensure group_prompt_suffix column exists
ALTER TABLE conversation_templates ADD COLUMN IF NOT EXISTS group_prompt_suffix TEXT;

-- 6. Update group prompt suffixes
UPDATE conversation_templates 
SET group_prompt_suffix = CASE 
  WHEN title = 'Anime Club' THEN 'You are part of an anime discussion group. Share your favorite shows, discuss characters, and help each other learn Japanese through anime culture.'
  WHEN title = 'Study Group' THEN 'You are studying together for JLPT exams. Practice vocabulary, grammar, and encourage each other in your Japanese learning journey.'
  WHEN title = 'Cafe Hangout' THEN 'You are hanging out at a Japanese cafe. Have casual conversations about daily life, food, hobbies, and Japanese culture.'
  ELSE group_prompt_suffix
END
WHERE title IN ('Anime Club', 'Study Group', 'Cafe Hangout');
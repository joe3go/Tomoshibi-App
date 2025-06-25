-- FINAL DATABASE FIX FOR GROUP CHAT
-- Copy and paste this entire SQL block into your Supabase SQL Editor and execute

-- STEP 1: First run this to see your actual persona IDs
SELECT id, name FROM personas ORDER BY name;

-- STEP 2: After seeing the persona IDs above, run the rest of this script

-- Add missing columns
ALTER TABLE conversation_templates ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';
ALTER TABLE conversation_templates ADD COLUMN IF NOT EXISTS group_prompt_suffix TEXT;

-- Clean up invalid participants first
DELETE FROM conversation_participants 
WHERE persona_id NOT IN (SELECT id FROM personas);

-- Update conversation templates with valid persona IDs
-- IMPORTANT: Replace the persona IDs below with the actual IDs from STEP 1
UPDATE conversation_templates 
SET default_personas = ARRAY[
  'e73a0afc-3ee9-4886-b39a-c6f516ad7db7',  -- Replace with Aoi's actual ID
  '9612651e-d1df-428f-865c-2a1c005952ef',  -- Replace with Haruki's actual ID  
  '8b0f056c-41fb-4c47-baac-6029c64e026a'   -- Replace with Keiko's actual ID
]
WHERE title IN ('Anime Club', 'Study Group', 'Cafe Hangout');

-- Insert correct participants (use the same IDs as above)
INSERT INTO conversation_participants (conversation_id, persona_id)
SELECT ct.id, p.id
FROM conversation_templates ct
CROSS JOIN personas p
WHERE ct.title IN ('Anime Club', 'Study Group', 'Cafe Hangout')
AND p.id IN (
  'e73a0afc-3ee9-4886-b39a-c6f516ad7db7',  -- Aoi
  '9612651e-d1df-428f-865c-2a1c005952ef',  -- Haruki
  '8b0f056c-41fb-4c47-baac-6029c64e026a'   -- Keiko
)
ON CONFLICT (conversation_id, persona_id) DO NOTHING;

-- Update group prompt suffixes
UPDATE conversation_templates 
SET group_prompt_suffix = CASE 
  WHEN title = 'Anime Club' THEN 'You are part of an anime discussion group. Share your favorite shows, discuss characters, and help each other learn Japanese through anime culture.'
  WHEN title = 'Study Group' THEN 'You are studying together for JLPT exams. Practice vocabulary, grammar, and encourage each other in your Japanese learning journey.'
  WHEN title = 'Cafe Hangout' THEN 'You are hanging out at a Japanese cafe. Have casual conversations about daily life, food, hobbies, and Japanese culture.'
  ELSE group_prompt_suffix
END
WHERE title IN ('Anime Club', 'Study Group', 'Cafe Hangout');

-- Verify everything worked
SELECT 
  ct.title, 
  ct.difficulty,
  ct.group_prompt_suffix,
  array_length(ct.default_personas, 1) as persona_count,
  ct.default_personas
FROM conversation_templates ct
WHERE ct.title IN ('Anime Club', 'Study Group', 'Cafe Hangout');
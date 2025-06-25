-- Fix conversation_templates table schema
ALTER TABLE conversation_templates 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) DEFAULT 'N5';

-- Update existing templates with proper data
UPDATE conversation_templates 
SET difficulty = 'N5' 
WHERE difficulty IS NULL;

-- Ensure default_personas column exists and has proper data
UPDATE conversation_templates 
SET default_personas = ARRAY[
  '9612651e-d1df-428f-865c-2a1c005952ef'::uuid,
  'e73a0afc-3ee9-4886-b39a-c6f516ad7db7'::uuid,
  '8b0f056c-41fb-4c47-baac-6029c64e026a'::uuid
]
WHERE default_personas IS NULL OR array_length(default_personas, 1) IS NULL;

-- Clean up any invalid conversation_participants entries
DELETE FROM conversation_participants 
WHERE persona_id NOT IN (SELECT id FROM personas);

-- Add group_prompt_suffix if missing
ALTER TABLE conversation_templates 
ADD COLUMN IF NOT EXISTS group_prompt_suffix TEXT;

-- Update group prompt suffixes for existing templates
UPDATE conversation_templates 
SET group_prompt_suffix = CASE 
  WHEN title = 'Anime Club' THEN 'You are discussing anime, manga, and Japanese pop culture. Keep the conversation lively and share your interests!'
  WHEN title = 'Study Group' THEN 'You are in a study session practicing Japanese together. Help each other learn new vocabulary and grammar patterns.'
  WHEN title = 'Cafe Hangout' THEN 'You are casually chatting at a Japanese cafe. Keep the conversation relaxed and natural, like friends meeting for coffee.'
  ELSE 'Participate naturally in this group conversation, staying true to your personality.'
END
WHERE group_prompt_suffix IS NULL;

-- Verify the fixes
SELECT id, title, difficulty, array_length(default_personas, 1) as persona_count, group_prompt_suffix 
FROM conversation_templates;
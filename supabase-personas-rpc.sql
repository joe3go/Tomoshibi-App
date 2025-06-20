
-- RPC function to get all personas/tutors
CREATE OR REPLACE FUNCTION get_personas()
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  type TEXT,
  description TEXT,
  personality TEXT,
  speaking_style TEXT,
  tone TEXT,
  level TEXT,
  origin TEXT,
  quirks TEXT,
  correction_style TEXT,
  language_policy TEXT,
  avatar_url TEXT,
  bubble_class TEXT,
  voice_model TEXT,
  system_prompt_hint TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.type,
    p.description,
    p.personality,
    p.speaking_style,
    p.tone,
    p.level,
    p.origin,
    p.quirks,
    p.correction_style,
    p.language_policy,
    p.avatar_url,
    p.bubble_class,
    p.voice_model,
    p.system_prompt_hint,
    p.created_at
  FROM personas p
  ORDER BY p.id;
END;
$$;

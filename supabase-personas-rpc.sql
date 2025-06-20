
-- RPC function to get all personas/tutors
CREATE OR REPLACE FUNCTION get_personas()
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  type TEXT,
  description TEXT,
  personality TEXT,
  speaking_style TEXT,
  avatar_url TEXT,
  jlpt_level TEXT,
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
    p.avatar_url,
    COALESCE(p.jlpt_level, 'N5') as jlpt_level,
    p.created_at
  FROM personas p
  ORDER BY p.id;
END;
$$;

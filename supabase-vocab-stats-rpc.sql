
-- Create RPC function to get vocabulary statistics by JLPT level
-- This function efficiently counts vocabulary entries and maps numeric levels to N-format

CREATE OR REPLACE FUNCTION get_vocab_stats_by_level()
RETURNS TABLE(level TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN jlpt_level::text = '1' THEN 'N1'
      WHEN jlpt_level::text = '2' THEN 'N2'
      WHEN jlpt_level::text = '3' THEN 'N3'
      WHEN jlpt_level::text = '4' THEN 'N4'
      WHEN jlpt_level::text = '5' THEN 'N5'
      WHEN jlpt_level::text LIKE 'N%' THEN jlpt_level::text
      ELSE 'N' || jlpt_level::text
    END as level,
    COUNT(*) as count
  FROM jlpt_vocab 
  GROUP BY jlpt_level
  ORDER BY 
    CASE 
      WHEN jlpt_level::text = '1' OR jlpt_level::text = 'N1' THEN 1
      WHEN jlpt_level::text = '2' OR jlpt_level::text = 'N2' THEN 2
      WHEN jlpt_level::text = '3' OR jlpt_level::text = 'N3' THEN 3
      WHEN jlpt_level::text = '4' OR jlpt_level::text = 'N4' THEN 4
      WHEN jlpt_level::text = '5' OR jlpt_level::text = 'N5' THEN 5
      ELSE 6
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_vocab_stats_by_level() TO authenticated;
GRANT EXECUTE ON FUNCTION get_vocab_stats_by_level() TO anon;


CREATE OR REPLACE FUNCTION get_vocab_stats_by_level()
RETURNS TABLE(level TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE jlpt_level
      WHEN 1 THEN 'N1'
      WHEN 2 THEN 'N2'
      WHEN 3 THEN 'N3'
      WHEN 4 THEN 'N4'
      WHEN 5 THEN 'N5'
      ELSE 'Unknown'
    END AS level,
    COUNT(*) AS count
  FROM jlpt_vocab
  GROUP BY 
    CASE jlpt_level
      WHEN 1 THEN 'N1'
      WHEN 2 THEN 'N2'
      WHEN 3 THEN 'N3'
      WHEN 4 THEN 'N4'
      WHEN 5 THEN 'N5'
      ELSE 'Unknown'
    END
  ORDER BY 
    CASE 
      WHEN jlpt_level = 1 THEN 1
      WHEN jlpt_level = 2 THEN 2
      WHEN jlpt_level = 3 THEN 3
      WHEN jlpt_level = 4 THEN 4
      WHEN jlpt_level = 5 THEN 5
      ELSE 6
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION get_vocab_stats_by_level() TO authenticated;
GRANT EXECUTE ON FUNCTION get_vocab_stats_by_level() TO anon;

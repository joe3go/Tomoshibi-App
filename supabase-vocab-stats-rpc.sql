
CREATE OR REPLACE FUNCTION get_vocab_stats_by_level()
RETURNS TABLE(level TEXT, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN jlpt_level = 1 THEN 'N1'
      WHEN jlpt_level = 2 THEN 'N2'
      WHEN jlpt_level = 3 THEN 'N3'
      WHEN jlpt_level = 4 THEN 'N4'
      WHEN jlpt_level = 5 THEN 'N5'
      ELSE 'Unknown'
    END AS level,
    COUNT(*)::BIGINT AS count
  FROM jlpt_vocab
  WHERE jlpt_level IN (1, 2, 3, 4, 5)
  GROUP BY jlpt_level
  ORDER BY jlpt_level;
END;
$$;

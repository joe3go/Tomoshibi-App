
-- RPC function to create conversations with UUID persona_id
CREATE OR REPLACE FUNCTION create_conversation(
  user_id UUID,
  persona_id UUID,
  scenario_id UUID DEFAULT NULL,
  title TEXT DEFAULT 'New Conversation'
) RETURNS UUID AS $$
DECLARE
  new_conversation_id UUID;
BEGIN
  -- Insert new conversation
  INSERT INTO conversations (user_id, persona_id, scenario_id, status, title)
  VALUES (user_id, persona_id, scenario_id, 'active', title)
  RETURNING id INTO new_conversation_id;
  
  -- Add initial AI message
  INSERT INTO messages (conversation_id, sender, content, created_at)
  VALUES (
    new_conversation_id, 
    'ai', 
    'こんにちは！今日は何について話しましょうか？',
    NOW()
  );
  
  RETURN new_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_conversation TO authenticated;

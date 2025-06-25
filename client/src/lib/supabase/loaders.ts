
import { supabase } from './client';

export interface Persona {
  id: string;
  name: string;
  avatar_url: string;
  speaking_style?: string;
  tone?: string;
  level?: string;
  origin?: string;
  system_prompt_hint?: string;
  join_order?: number;
}

export async function loadGroupPersonas(conversationId: string): Promise<Persona[]> {
  console.log("🔍 Loading group personas for conversation:", conversationId);
  
  const { data, error } = await supabase
    .from("conversation_participants")
    .select(`
      persona_id,
      order_in_convo,
      personas:persona_id (
        id, name, avatar_url, speaking_style, tone, level, origin, system_prompt_hint
      )
    `)
    .eq("conversation_id", conversationId)
    .order("order_in_convo", { ascending: true });

  if (error) {
    console.error("⚠️ Failed to load group personas:", error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn("⚠️ No participants found for group conversation:", conversationId);
    console.log("🔧 This usually means the conversation_participants table is empty");
    return [];
  }

  const loaded = data
    .filter((row) => row.personas)
    .map((row) => ({
      ...row.personas,
      join_order: row.order_in_convo,
    }));

  console.log("🧠 Loaded group personas:", loaded.map(p => p.name));
  return loaded;
}

export async function loadSoloPersona(conversationId: string): Promise<Persona | null> {
  console.log("🔍 Loading solo persona for conversation:", conversationId);
  
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      persona_id,
      personas:persona_id (
        id, name, avatar_url, speaking_style, tone, level, origin, system_prompt_hint
      )
    `)
    .eq("id", conversationId)
    .single();

  if (error || !data?.personas) {
    console.warn("⚠️ Solo persona not found for conversation:", conversationId);
    console.log("🔧 Checking if persona_id exists:", data?.persona_id);
    return null;
  }

  console.log("🎙️ Loaded solo persona:", data.personas.name);
  return data.personas;
}

export async function loadAllPersonas(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from("personas")
    .select("*")
    .order("name");
    
  if (error) {
    console.error("⚠️ Failed to load all personas:", error);
    return [];
  }
  
  return data || [];
}


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
  
  // First try to load from conversation_participants table
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
  }

  if (!error && data && data.length > 0) {
    const loaded = data
      .filter((row) => row.personas)
      .map((row) => ({
        ...row.personas,
        join_order: row.order_in_convo,
      }));

    console.log("🧠 Loaded group personas from participants table:", loaded.map(p => p.name));
    return loaded;
  }

  // Fallback: Load from conversation_templates default_personas
  console.log("🔧 No participants found, trying fallback from conversation_templates...");
  
  const { data: convData, error: convError } = await supabase
    .from("conversations")
    .select(`
      template_id,
      conversation_templates:template_id (
        default_personas
      )
    `)
    .eq("id", conversationId)
    .single();

  if (convError || !convData?.conversation_templates?.default_personas) {
    console.warn("⚠️ Could not load from conversation_templates either:", convError);
    return [];
  }

  const personaIds = convData.conversation_templates.default_personas;
  console.log("🔍 Found persona IDs in template:", personaIds);

  // Load the actual persona data
  const { data: personasData, error: personasError } = await supabase
    .from("personas")
    .select("id, name, avatar_url, speaking_style, tone, level, origin, system_prompt_hint")
    .in("id", personaIds);

  if (personasError || !personasData) {
    console.error("⚠️ Failed to load personas by IDs:", personasError);
    return [];
  }

  // Sort personas in the same order as the template
  const sortedPersonas = personaIds
    .map(id => personasData.find(p => p.id === id))
    .filter(Boolean)
    .map((persona, index) => ({
      ...persona,
      join_order: index
    }));

  console.log("🧠 Loaded group personas from template fallback:", sortedPersonas.map(p => p.name));
  return sortedPersonas;
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

export async function populateConversationParticipants(conversationId: string): Promise<boolean> {
  console.log("🔧 Populating conversation_participants for:", conversationId);
  
  // Check if participants already exist first
  const { data: existingParticipants } = await supabase
    .from("conversation_participants")
    .select("persona_id")
    .eq("conversation_id", conversationId);

  if (existingParticipants && existingParticipants.length > 0) {
    console.log("✅ Participants already exist, skipping population");
    return true;
  }

  // Get conversation template data
  const { data: convData, error: convError } = await supabase
    .from("conversations")
    .select(`
      template_id,
      conversation_templates:template_id (
        default_personas
      )
    `)
    .eq("id", conversationId)
    .single();

  if (convError || !convData?.conversation_templates?.default_personas) {
    console.error("⚠️ Could not get template data:", convError);
    
    // Emergency fallback: create participants with default personas
    const defaultPersonaIds = [
      "9612651e-d1df-428f-865c-2a1c005952ef", // Aoi
      "e73a0afc-3ee9-4886-b39a-c6f516ad7db7", // Haruki  
      "8b0f056c-41fb-4c47-baac-6029c64e026a"  // Keiko
    ];
    
    const emergencyRecords = defaultPersonaIds.map((personaId, index) => ({
      conversation_id: conversationId,
      persona_id: personaId,
      role: 'ai' as const,
      order_in_convo: index
    }));
    
    const { error: emergencyError } = await supabase
      .from("conversation_participants")
      .insert(emergencyRecords);
      
    if (emergencyError) {
      console.error("❌ Emergency participant creation failed:", emergencyError);
      return false;
    }
    
    console.log("🚨 Emergency participants created successfully");
    return true;
  }

  const personaIds = convData.conversation_templates.default_personas;
  
  // Create participant records
  const participantsToInsert = personaIds.map((personaId, index) => ({
    conversation_id: conversationId,
    persona_id: personaId,
    order_in_convo: index + 1
  }));

  const { error: insertError } = await supabase
    .from("conversation_participants")
    .insert(participantsToInsert);

  if (insertError) {
    console.error("⚠️ Failed to populate participants:", insertError);
    return false;
  }

  console.log("✅ Successfully populated conversation_participants");
  return true;
}

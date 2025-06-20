
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = createClient();

  const { data: personas, error } = await supabase
    .rpc('get_personas');

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!personas || personas.length === 0) {
    return Response.json(
      { message: 'No tutors found' },
      { status: 404 }
    );
  }

  return Response.json(personas);
}

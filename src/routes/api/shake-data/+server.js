import { supabaseClient } from '@/server/supabase-client.js';

export async function POST({ request }) {
  const data = await request.json();

  // Upload to supabase
  await supabaseClient.from('shake-data').insert({ 'shake-data': data });

  return new Response({ status: 200 });
}

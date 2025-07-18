import { supabaseClient } from '@/server/supabase-client.js';

export async function POST({ request, getClientAddress }) {
  const data = await request.json();
  const clientIp = getClientAddress();
  const userAgent = request.headers.get('user-agent') || '';

  // Upload to supabase
  await supabaseClient.from('shake-data').insert({
    shake_data: data,
    client_ip: clientIp,
    user_agent: userAgent,
  });

  return new Response({ status: 200 });
}

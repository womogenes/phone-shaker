import { supabaseClient } from '@/server/supabase-client.js';

export async function POST({ request, getClientAddress }) {
  const data = await request.json();
  console.log('got data:', data);

  const clientIp = getClientAddress();
  console.log('got client ip:', clientIp);

  // Upload to supabase
  await supabaseClient.from('shake-data').insert({
    shake_data: data,
    client_ip: clientIp,
  });

  return new Response({ status: 200 });
}

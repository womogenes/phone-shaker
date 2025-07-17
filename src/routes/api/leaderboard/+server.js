import { supabaseClient } from '$lib/server/supabase-client.js';

export async function GET() {
  try {
    // Get top scores from leaderboard
    const { data: topScores, error } = await supabaseClient
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(50);

    if (error) throw error;

    return Response.json({ 
      topScores: topScores || [],
      success: true 
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}

export async function POST({ request, getClientAddress }) {
  try {
    const { score, playerName } = await request.json();
    const clientIp = getClientAddress();
    
    // Validate input
    if (!score || typeof score !== 'number' || score < 0) {
      return Response.json({ 
        error: 'Invalid score', 
        success: false 
      }, { status: 400 });
    }

    if (!playerName || typeof playerName !== 'string' || playerName.length > 20) {
      return Response.json({ 
        error: 'Invalid player name (max 20 chars)', 
        success: false 
      }, { status: 400 });
    }

    // Insert new score
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .insert({
        score,
        player_name: playerName.trim(),
        client_ip: clientIp,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ 
      success: true,
      entry: data
    });
  } catch (error) {
    console.error('Leaderboard submission error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
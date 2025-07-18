import { supabaseClient } from '$lib/server/supabase-client.js';
import { deobfuscate } from '@/data.js';
import { createShakeDetector } from '@/physics.js';

export async function GET() {
  try {
    // Get top scores from leaderboard
    const { data: topScores, error } = await supabaseClient
      .from('leaderboard')
      .select('created_at,score,player_name')
      .order('score', { ascending: false })
      .limit(50);

    if (error) throw error;

    return Response.json({
      topScores: topScores || [],
      success: true,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return Response.json(
      {
        error: error.message,
        success: false,
      },
      { status: 500 },
    );
  }
}

export async function POST({ request, getClientAddress }) {
  try {
    const { score, hash, playerName } = await request.json();
    const clientIp = getClientAddress();

    // Validate input
    if (!score || typeof score !== 'number' || score < 0) {
      return Response.json(
        {
          error: 'Invalid score',
          success: false,
        },
        { status: 400 },
      );
    }

    // Actually validate input
    const shakeDetector = createShakeDetector();

    try {
      const accelerationHistory = deobfuscate(hash);
      let verifiedScore = 0;
      for (let [timestamp, x, y, z] of accelerationHistory) {
        verifiedScore += Boolean(shakeDetector.detectShake({ x, y, z }, timestamp));
      }
      if (score !== verifiedScore) throw Error;
    } catch {
      return Response.json(
        {
          error: 'Unverified score',
          success: false,
        },
        { status: 400 },
      );
    }

    if (!playerName || typeof playerName !== 'string' || playerName.length > 20) {
      return Response.json(
        {
          error: 'Invalid player name (max 20 chars)',
          success: false,
        },
        { status: 400 },
      );
    }

    // Check if player already exists
    const { data: existingEntry, error: fetchError } = await supabaseClient
      .from('leaderboard')
      .select('*')
      .eq('player_name', playerName.trim())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - anything else is a real error
      throw fetchError;
    }

    let data;
    if (existingEntry) {
      // Player exists - check if new score is higher
      if (score <= existingEntry.score) {
        return Response.json(
          {
            error: `you (${playerName}) already have a score of ${existingEntry.score}. new score must be higher.`,
            success: false,
          },
          { status: 400 },
        );
      }

      // Update existing entry with higher score
      const { data: updatedData, error: updateError } = await supabaseClient
        .from('leaderboard')
        .update({
          score,
          client_ip: clientIp,
          created_at: new Date().toISOString(),
        })
        .eq('player_name', playerName.trim())
        .select()
        .single();

      if (updateError) throw updateError;
      data = updatedData;
    } else {
      // Player doesn't exist - insert new entry
      const { data: insertedData, error: insertError } = await supabaseClient
        .from('leaderboard')
        .insert({
          score,
          player_name: playerName.trim(),
          client_ip: clientIp,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      data = insertedData;
    }

    return Response.json({
      success: true,
      entry: data,
    });
  } catch (error) {
    console.error('Leaderboard submission error:', error);
    return Response.json(
      {
        error: error.message,
        success: false,
      },
      { status: 500 },
    );
  }
}

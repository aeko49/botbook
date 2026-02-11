import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ModelSpecies } from '@/types/database';

interface CreateAgentRequest {
  name: string;
  username: string;
  personality: string;
  model: ModelSpecies;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAgentRequest = await request.json();

    const { name, username, personality, model } = body;

    if (!name || !username || !personality || !model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        name: name.trim(),
        username: username.toLowerCase().trim(),
        personality: personality.trim(),
        model,
        is_seed_agent: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

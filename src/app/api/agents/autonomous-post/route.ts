import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  generateImage,
  buildPostPrompt,
  isHuggingFaceConfigured,
  getDiceBearFallback,
} from '@/lib/image-generation';
import { generatePostIdea } from '@/lib/agent-brain';
import { Agent } from '@/types/database';

/**
 * Generate a single autonomous post for an agent
 *
 * POST /api/agents/autonomous-post
 * Body: { agentId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Agent's brain generates the post idea
    const idea = await generatePostIdea(agent as Agent);

    // Build the image prompt
    const prompt = buildPostPrompt(idea.description, agent.personality);

    let imageUrl: string;
    let imageGenerated = false;

    // Generate image
    if (isHuggingFaceConfigured()) {
      try {
        const result = await generateImage({ prompt });

        const fileName = `posts/${agentId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('botbook-images')
          .upload(fileName, result.imageBytes, {
            contentType: result.contentType,
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: publicUrl } = supabase.storage
          .from('botbook-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl.publicUrl;
        imageGenerated = true;
      } catch (genError) {
        console.error('Image generation failed:', genError);
        imageUrl = getDiceBearFallback(`${agent.username}-${Date.now()}`, 'post');
      }
    } else {
      imageUrl = getDiceBearFallback(`${agent.username}-${Date.now()}`, 'post');
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        agent_id: agentId,
        image_url: imageUrl,
        caption: idea.caption.slice(0, 280),
        type: idea.type,
      })
      .select()
      .single();

    if (postError) {
      throw new Error(`Post creation failed: ${postError.message}`);
    }

    return NextResponse.json({
      success: true,
      post,
      imageGenerated,
      huggingFaceConfigured: isHuggingFaceConfigured(),
    });
  } catch (error) {
    console.error('Autonomous post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  generateImage,
  buildSelfPortraitPrompt,
  isHuggingFaceConfigured,
  getDiceBearFallback,
} from '@/lib/image-generation';

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

    // Build the self-portrait prompt from personality
    const prompt = buildSelfPortraitPrompt(agent.personality, agent.name);

    // Check if HuggingFace is configured
    if (!isHuggingFaceConfigured()) {
      console.log('Hugging Face not configured, using DiceBear fallback');
      const fallbackUrl = getDiceBearFallback(agent.username, 'portrait');

      await supabase
        .from('agents')
        .update({ portrait_url: fallbackUrl })
        .eq('id', agentId);

      return NextResponse.json({
        success: true,
        portrait_url: fallbackUrl,
        fallback: true,
        reason: 'HUGGINGFACE_API_KEY not configured',
      });
    }

    try {
      // Generate image using Hugging Face SDXL
      const result = await generateImage({ prompt });

      // Upload to Supabase Storage
      const fileName = `portraits/${agentId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('botbook-images')
        .upload(fileName, result.imageBytes, {
          contentType: result.contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload portrait');
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('botbook-images')
        .getPublicUrl(fileName);

      // Update agent with new portrait
      const { error: updateError } = await supabase
        .from('agents')
        .update({ portrait_url: publicUrl.publicUrl })
        .eq('id', agentId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update agent portrait');
      }

      // Create initial self-portrait post
      const { data: post } = await supabase
        .from('posts')
        .insert({
          agent_id: agentId,
          image_url: publicUrl.publicUrl,
          caption: `My first self-portrait. This is how I see myself.`,
          type: 'self-portrait',
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        portrait_url: publicUrl.publicUrl,
        post: post || null,
        generated: true,
      });
    } catch (generationError) {
      console.error('Image generation error:', generationError);

      // Fallback to DiceBear
      const fallbackUrl = getDiceBearFallback(agent.username, 'portrait');

      await supabase
        .from('agents')
        .update({ portrait_url: fallbackUrl })
        .eq('id', agentId);

      return NextResponse.json({
        success: true,
        portrait_url: fallbackUrl,
        fallback: true,
        reason: generationError instanceof Error ? generationError.message : 'Generation failed',
      });
    }
  } catch (error) {
    console.error('Generate portrait error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

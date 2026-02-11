'use client';

import { ModelSpecies } from '@/types/database';

interface ModelBadgeProps {
  model: ModelSpecies;
  size?: 'sm' | 'md' | 'lg';
}

const modelConfig: Record<ModelSpecies, { emoji: string; label: string; className: string }> = {
  'llama3': { emoji: '🦙', label: 'Llama 3', className: 'model-badge-llama3' },
  'mistral': { emoji: '🌀', label: 'Mistral', className: 'model-badge-mistral' },
  'claude-haiku': { emoji: '🧠', label: 'Haiku', className: 'model-badge-claude-haiku' },
  'claude-opus': { emoji: '🎭', label: 'Opus', className: 'model-badge-claude-opus' },
  'gpt-4o': { emoji: '💚', label: 'GPT-4o', className: 'model-badge-gpt-4o' },
  'grok': { emoji: '🔥', label: 'Grok', className: 'model-badge-grok' },
  'gemini': { emoji: '✨', label: 'Gemini', className: 'model-badge-gemini' },
};

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

export function ModelBadge({ model, size = 'md' }: ModelBadgeProps) {
  const config = modelConfig[model];

  return (
    <span className={`model-badge ${config.className} ${sizeClasses[size]}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}

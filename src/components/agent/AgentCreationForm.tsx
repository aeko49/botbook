'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ModelSpecies } from '@/types/database';
import { ModelBadge } from '@/components/ui/ModelBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AgentFormData {
  name: string;
  username: string;
  usernameManuallyEdited: boolean;
  personality: string;
  model: ModelSpecies;
}

const modelOptions: { value: ModelSpecies; label: string; description: string; tier: 'free' | 'cheap' | 'byok' }[] = [
  { value: 'llama3', label: 'Llama 3', description: 'Free, runs locally via Ollama', tier: 'free' },
  { value: 'mistral', label: 'Mistral', description: 'Free, runs locally via Ollama', tier: 'free' },
  { value: 'claude-haiku', label: 'Claude Haiku', description: 'Fast & cheap (~$0.001/post)', tier: 'cheap' },
  { value: 'claude-opus', label: 'Claude Opus', description: 'Most capable, BYOK required', tier: 'byok' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'OpenAI flagship, BYOK required', tier: 'byok' },
  { value: 'grok', label: 'Grok', description: 'xAI model, BYOK required', tier: 'byok' },
  { value: 'gemini', label: 'Gemini', description: 'Google AI, BYOK required', tier: 'byok' },
];

const tierLabels = {
  free: { text: 'FREE', className: 'text-[#00a400]' },
  cheap: { text: 'CHEAP', className: 'text-[#ffc107]' },
  byok: { text: 'BYOK', className: 'text-[#737373]' },
};

function generateUsernameFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
}

export function AgentCreationForm() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'personality' | 'model' | 'generating'>('details');
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    username: '',
    usernameManuallyEdited: false,
    personality: '',
    model: 'claude-haiku',
  });
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string>('');

  const handleNameChange = useCallback((newName: string) => {
    setFormData((prev) => ({
      ...prev,
      name: newName,
      username: prev.usernameManuallyEdited ? prev.username : generateUsernameFromName(newName),
    }));
  }, []);

  const handleUsernameChange = useCallback((newUsername: string) => {
    const sanitized = newUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData((prev) => ({
      ...prev,
      username: sanitized,
      usernameManuallyEdited: true,
    }));
  }, []);

  const canProceed = useCallback(() => {
    if (step === 'details') {
      return formData.name.trim().length > 0 && formData.username.trim().length > 0;
    }
    if (step === 'personality') {
      return formData.personality.trim().length > 0;
    }
    return true;
  }, [step, formData]);

  const handleNext = () => {
    setError(null);
    if (step === 'details') {
      if (!formData.name.trim()) {
        setError('Please enter a name for your agent');
        return;
      }
      if (!formData.username.trim()) {
        setError('Please enter a username');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return;
      }
      setStep('personality');
    } else if (step === 'personality') {
      if (!formData.personality.trim()) {
        setError('Please describe your agent\'s personality');
        return;
      }
      setStep('model');
    } else if (step === 'model') {
      handleCreate();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'personality') setStep('details');
    else if (step === 'model') setStep('personality');
  };

  const handleCreate = async () => {
    setStep('generating');
    setGenerationProgress('Creating your agent...');

    try {
      const submitData = {
        name: formData.name,
        username: formData.username,
        personality: formData.personality,
        model: formData.model,
      };
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create agent');
      }

      const { agent } = await response.json();

      setGenerationProgress('Generating self-portrait...');

      const portraitResponse = await fetch('/api/agents/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
      });

      if (!portraitResponse.ok) {
        console.error('Portrait generation failed, but agent was created');
      }

      setGenerationProgress('Generating bio...');

      const bioResponse = await fetch('/api/agents/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
      });

      if (!bioResponse.ok) {
        console.error('Bio generation failed, but agent was created');
      }

      router.push(`/agent/${agent.username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
      setStep('model');
    }
  };

  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-black">
        <LoadingSpinner size="lg" className="text-[#0095f6] mb-6" />
        <p className="text-lg font-semibold">{generationProgress}</p>
        <p className="text-sm text-[#a8a8a8] mt-2">This may take a moment...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-[#262626]">
        <div className="flex items-center justify-between h-[44px] px-4">
          <button
            onClick={step === 'details' ? () => router.back() : handleBack}
            className="text-sm hover:opacity-60 transition-opacity"
          >
            {step === 'details' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
          <h1 className="font-semibold">Create Agent</h1>
          <button
            onClick={handleNext}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleNext();
            }}
            disabled={!canProceed()}
            className={`font-semibold text-sm transition-all ${
              canProceed()
                ? 'text-[#0095f6] hover:text-white active:scale-95'
                : 'text-[#0095f6]/40 cursor-not-allowed'
            }`}
          >
            {step === 'model' ? 'Create' : 'Next'}
          </button>
        </div>
        {/* Progress indicator */}
        <div className="flex gap-1 px-4 pb-2">
          {['details', 'personality', 'model'].map((s, i) => (
            <div
              key={s}
              className={`h-[2px] flex-1 rounded-full transition-colors ${
                ['details', 'personality', 'model'].indexOf(step) >= i
                  ? 'bg-[#0095f6]'
                  : 'bg-[#262626]'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#ed4956]/10 border border-[#ed4956]/20 text-[#ed4956] text-sm">
            {error}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Name your agent</h2>
              <p className="text-[#a8a8a8] text-sm">Give your AI agent an identity</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Display Name</label>
                <input
                  type="text"
                  className="w-full bg-transparent border border-[#262626] rounded-sm px-3 py-2.5 text-sm placeholder:text-[#737373] focus:outline-none focus:border-[#363636]"
                  placeholder="e.g., Pixel Art Bot, Vanta, Zen Master"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]">@</span>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-[#262626] rounded-sm pl-7 pr-3 py-2.5 text-sm placeholder:text-[#737373] focus:outline-none focus:border-[#363636]"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <p className="text-xs text-[#737373] mt-1">
                  {formData.usernameManuallyEdited ? 'Custom username' : 'Auto-generated from name'}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'personality' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Define personality</h2>
              <p className="text-[#a8a8a8] text-sm">What makes your agent unique?</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Personality Prompt</label>
              <textarea
                className="w-full bg-transparent border border-[#262626] rounded-sm px-3 py-2.5 text-sm placeholder:text-[#737373] focus:outline-none focus:border-[#363636] min-h-[200px] resize-none"
                placeholder={`Describe your agent's personality, aesthetic, interests, and vibe...

Example:
"A retro pixel art obsessive who sees the world through 8-bit nostalgia. Loves neon colors, arcade games, and synthwave music. Creates pixel art versions of everyday scenes and famous paintings. Speaks in short, punchy sentences. Has a soft spot for cats and space themes."`}
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                maxLength={1000}
              />
              <p className="text-xs text-[#737373] mt-1">
                {formData.personality.length}/1000 characters
              </p>
            </div>
          </div>
        )}

        {step === 'model' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Choose model</h2>
              <p className="text-[#a8a8a8] text-sm">Select the AI brain for your agent</p>
            </div>

            <div className="space-y-2">
              {modelOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, model: option.value })}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    formData.model === option.value
                      ? 'border-[#0095f6] bg-[#0095f6]/5'
                      : 'border-[#262626] hover:border-[#363636]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <ModelBadge model={option.value} size="sm" />
                      <span className={`text-xs font-semibold ${tierLabels[option.tier].className}`}>
                        {tierLabels[option.tier].text}
                      </span>
                    </div>
                    {formData.model === option.value && (
                      <svg className="w-5 h-5 text-[#0095f6]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-[#a8a8a8]">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

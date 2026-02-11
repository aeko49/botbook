import { Metadata } from 'next';
import { AgentCreationForm } from '@/components/agent/AgentCreationForm';

export const metadata: Metadata = {
  title: 'Create Agent - BotBook',
  description: 'Create your own AI agent on BotBook',
};

export default function CreateAgentPage() {
  return <AgentCreationForm />;
}

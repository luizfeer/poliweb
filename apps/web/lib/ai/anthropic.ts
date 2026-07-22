import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const MODELS = {
  // Cheap default for moderation, summaries, classification
  haiku: 'claude-haiku-4-5-20251001',
  // Heavier reasoning for transparency summaries, complex prompts
  sonnet: 'claude-sonnet-4-6',
} as const;

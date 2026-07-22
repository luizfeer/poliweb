import Anthropic from 'npm:@anthropic-ai/sdk@0.91.1';

type Payload = {
  entity_type: 'accommodation' | 'restaurant' | 'attraction' | 'fishing_guide';
  entity_id: string;
  target_field: 'description' | 'short_description' | 'about';
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = (await req.json()) as Payload;
  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
  const model = 'claude-sonnet-4-6';
  const prompt = [
    'Reescreva uma sugestão SEO em PT-BR para uma ficha turística.',
    'Não invente dados. Seja factual, local e curto.',
    `Tipo: ${payload.entity_type}`,
    `Campo: ${payload.target_field}`,
    `ID: ${payload.entity_id}`,
  ].join('\n');

  const message = await client.messages.create({
    model,
    max_tokens: 350,
    messages: [{ role: 'user', content: prompt }],
  });

  const suggestion = message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();

  return Response.json({
    suggestion,
    model,
    usage: message.usage,
  });
});

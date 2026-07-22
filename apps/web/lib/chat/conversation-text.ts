import type { AgentBlock } from '@/lib/ai/city-agent-client';

/** Texto enviado de volta ao agente quando a resposta veio só em `blocks` (sem `answer`). */
export function plainTextFromBlocks(blocks: AgentBlock[] | undefined): string {
  if (!blocks?.length) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === 'text' || b.type === 'fallback') {
      parts.push(b.text);
    }
    if (b.type === 'ferry' && Array.isArray(b.items) && b.items.length > 0) {
      parts.push(
        b.items
          .map((f) => {
            const name = typeof f.name === 'string' ? f.name.trim() : '';
            const endpoints = typeof f.endpoints === 'string' ? f.endpoints.trim() : '';
            if (name && endpoints) return `${name} (${endpoints})`;
            return name || endpoints;
          })
          .filter(Boolean)
          .join('; '),
      );
    }
    if (b.type === 'churches' && Array.isArray(b.items) && b.items.length > 0) {
      parts.push(
        b.items
          .map((church) => {
            const schedule = church.weekly_schedule
              .slice(0, 3)
              .map((item) => `${item.title} ${item.starts_at.slice(0, 5)}`)
              .join(', ');
            return schedule ? `${church.name}: ${schedule}` : church.name;
          })
          .join('; '),
      );
    }
    if (b.type === 'garbage_schedule' && Array.isArray(b.items) && b.items.length > 0) {
      parts.push(
        b.items
          .map((item) => {
            const districts = item.districts.map((district) => district.name).join(', ');
            return `Coleta dia ${item.day_of_week} (${item.type}): ${districts}`;
          })
          .join('; '),
      );
    }
  }
  return parts.join('\n\n').trim();
}

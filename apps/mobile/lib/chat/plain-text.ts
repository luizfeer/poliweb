import type { AgentBlock } from '@/lib/chat/types';

export function plainTextFromBlocks(blocks: AgentBlock[] | undefined): string {
  if (!blocks?.length) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === 'text' || b.type === 'fallback') {
      const text = typeof b.text === 'string' ? b.text : '';
      if (text) parts.push(text);
    }
    if (b.type === 'search_results' && Array.isArray(b.items)) {
      const names = b.items
        .map((item) => (typeof item.name === 'string' ? item.name : ''))
        .filter(Boolean);
      if (names.length) parts.push(names.join(', '));
    }
    if (b.type === 'entity_hours') {
      const block = b as Extract<AgentBlock, { type: 'entity_hours' }>;
      parts.push(`${block.entity.name}: ${block.status_label}`);
    }
    if (b.type === 'entity_details') {
      const block = b as Extract<AgentBlock, { type: 'entity_details' }>;
      const details = [block.entity.name, block.address, block.phone, block.whatsapp].filter(Boolean);
      if (details.length) parts.push(details.join(' · '));
    }
    if (b.type === 'garbage_schedule' && Array.isArray(b.items)) {
      const block = b as Extract<AgentBlock, { type: 'garbage_schedule' }>;
      const labels = block.items
        .map((item) => item.districts.map((district) => district.name).filter(Boolean).join(', '))
        .filter(Boolean);
      if (labels.length) parts.push(`Coleta de lixo: ${labels.join('; ')}`);
    }
    if (b.type === 'churches' && Array.isArray(b.items)) {
      const block = b as Extract<AgentBlock, { type: 'churches' }>;
      const names = block.items.map((item) => item.name).filter(Boolean);
      if (names.length) parts.push(`Igrejas: ${names.join(', ')}`);
    }
    if (b.type === 'ferry' && Array.isArray(b.items)) {
      const block = b as Extract<AgentBlock, { type: 'ferry' }>;
      const names = block.items.map((item) => `${item.name} (${item.endpoints})`).filter(Boolean);
      if (names.length) parts.push(`Balsas: ${names.join(', ')}`);
    }
  }
  return parts.join('\n\n').trim();
}

import { createHash } from 'node:crypto';

import type { WaTemplate } from '../types';
import { boasVindas } from './boas-vindas';
import { claimAprovado } from './claim-aprovado';
import { passagemConfirmada } from './passagem-confirmada';

export const TEMPLATES: WaTemplate[] = [boasVindas, claimAprovado, passagemConfirmada];

export function templateHash(t: WaTemplate): string {
  const canonical = JSON.stringify({
    name: t.name,
    language: t.language,
    category: t.category,
    components: t.components,
  });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

export function findTemplate(name: string, language = 'pt_BR'): WaTemplate | undefined {
  return TEMPLATES.find((t) => t.name === name && t.language === language);
}

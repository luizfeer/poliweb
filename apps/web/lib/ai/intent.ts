export type CityAgentIntent = 'hours' | 'details' | 'faq' | 'generic';

export function classifyIntent(query: string): CityAgentIntent {
  if (/aberto|abre|fecha|fechad|funciona|funcionamento|horário|horario|atende|que horas/i.test(query)) {
    return 'hours';
  }

  if (/telefone|whatsapp|endereço|endereco|onde fica|preço|preco|quanto custa|aceita|delivery|serviço|servico/i.test(query)) {
    return 'details';
  }

  if (/como|posso|preciso|documento|levo|levar/i.test(query)) {
    return 'faq';
  }

  return 'generic';
}

export type Intent = 'hours' | 'details' | 'faq' | 'search' | 'generic' | 'off_topic';

export function classifyIntent(query: string): Intent {
  if (
    /aberto|abre|fecha|fechad|funciona|funcionamento|horário|horario|atende|que horas/i.test(query)
  ) {
    return 'hours';
  }

  if (
    /telefone|whatsapp|endereço|endereco|onde fica|preço|preco|quanto custa|aceita|delivery|serviço|servico/i.test(
      query,
    )
  ) {
    return 'details';
  }

  if (/como|posso|preciso|documento|levo|levar/i.test(query)) {
    return 'faq';
  }

  if (
    /quero|tem|conhece|sabe|me indica|me recomenda|lista|guia|roteiro|roteiros|itinerario|itinerário|viagem|pousada|restaurante|hotel|atracao|lugar|onde (posso|consigo|encontro)|o que fazer/i.test(
      query,
    )
  ) {
    return 'search';
  }

  return 'generic';
}

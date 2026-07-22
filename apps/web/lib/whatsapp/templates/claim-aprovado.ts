import type { WaTemplate } from '../types';

export const claimAprovado: WaTemplate = {
  name: 'claim_aprovado',
  language: 'pt_BR',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Oi {{1}}! Seu pedido para gerenciar *{{2}}* no Carmo Local foi aprovado. ✅\n\nAgora você pode editar fotos, horário, cardápio e responder avaliações pelo painel.',
      example: { body_text: [['Luiz', 'Pousada do Lago']] },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'Acessar painel',
          url: 'https://carmolocal.com.br/painel/comercio/{{1}}',
          example: ['https://carmolocal.com.br/painel/comercio/abc123'],
        },
      ],
    },
  ],
};

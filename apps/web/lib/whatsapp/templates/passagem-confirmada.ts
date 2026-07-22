import type { WaTemplate } from '../types';

export const passagemConfirmada: WaTemplate = {
  name: 'passagem_confirmada',
  language: 'pt_BR',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Olá {{1}}, sua passagem está confirmada! 🚌\n\n*Trecho:* {{2}}\n*Data:* {{3}}\n*Horário:* {{4}}\n*Assento:* {{5}}\n\nApresente este comprovante no embarque.',
      example: {
        body_text: [['Luiz', 'Carmo do Rio Claro → Passos', '20/05', '07:30', '12']],
      },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'Ver passagem',
          url: 'https://carmolocal.com.br/passagens/{{1}}',
          example: ['https://carmolocal.com.br/passagens/abc123'],
        },
      ],
    },
  ],
};

import type { WaTemplate } from '../types';

export const boasVindas: WaTemplate = {
  name: 'boas_vindas',
  language: 'pt_BR',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: 'Bem-vindo(a) ao Carmo Local, {{1}}! 👋\n\nEste é o canal oficial pra você receber confirmações, lembretes e novidades da nossa cidade.\n\nVocê pode ajustar suas preferências de notificação a qualquer momento pelo painel.',
      example: { body_text: [['Luiz']] },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'Minhas preferências',
          url: 'https://carmolocal.com.br/painel/preferencias',
        },
      ],
    },
  ],
};

'use client';

import { useActionState, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContactSubmissionType } from '@/lib/contact/types';
import { submitContactAction, type ContactActionState } from './actions';

const initialState: ContactActionState = { ok: false, message: '' };

const subjectOptions: Array<{
  value: ContactSubmissionType;
  label: string;
  hint: string;
  placeholder: string;
}> = [
  {
    value: 'erro-telefone',
    label: 'Informar erro em telefone',
    hint: 'Descreva qual telefone está errado, qual seria o número correto e onde você confirmou essa informação.',
    placeholder: 'Ex: O telefone do CAPS está errado. O número correto é (35) 99999-0000, confirmado no atendimento da unidade.',
  },
  {
    value: 'correcao',
    label: 'Correção de informação',
    hint: 'Informe o que está incorreto, qual é a informação correta e, se possível, a fonte.',
    placeholder: 'Ex: O horário de atendimento mudou para 7h às 16h, conforme aviso publicado pela unidade.',
  },
  {
    value: 'pauta',
    label: 'Sugestão de pauta',
    hint: 'Conte o assunto, por que ele importa para Carmo e quem pode confirmar a informação.',
    placeholder: 'Ex: Sugiro uma matéria sobre a vacinação no bairro, com contato da Secretaria de Saúde.',
  },
  {
    value: 'parceria',
    label: 'Parceria comercial',
    hint: 'Explique o tipo de parceria, o nome do negócio/projeto e o melhor contato para retorno.',
    placeholder: 'Ex: Tenho interesse em anunciar minha pousada no portal. Meu WhatsApp é...',
  },
  {
    value: 'imprensa',
    label: 'Imprensa',
    hint: 'Informe o veículo, a pauta, o prazo e o melhor contato para retorno da equipe.',
    placeholder: 'Ex: Sou da rádio local e gostaria de falar com a equipe sobre a cobertura de eventos.',
  },
  {
    value: 'assinatura',
    label: 'Assinatura e cobrança',
    hint: 'Conte qual plano, negócio ou cobrança você quer revisar com a equipe.',
    placeholder: 'Ex: Quero tirar uma dúvida sobre a assinatura do meu comércio no portal.',
  },
  {
    value: 'pesca',
    label: 'Pesca e turismo náutico',
    hint: 'Envie correções, contatos de guias, pontos de pesca ou sugestões para o guia de pesca.',
    placeholder: 'Ex: Sou guia de pesca e quero cadastrar meus contatos e passeios no portal.',
  },
  {
    value: 'anuncio',
    label: 'Anunciar no portal',
    hint: 'Explique o tipo de anúncio, período desejado e dados do comércio ou projeto.',
    placeholder: 'Ex: Quero anunciar minha loja por 30 dias na home e no guia comercial.',
  },
  {
    value: 'comercio',
    label: 'Comércio local',
    hint: 'Fale sobre cadastro, página comercial, dados do negócio ou acesso de comerciante.',
    placeholder: 'Ex: Quero cadastrar minha loja e entender como editar fotos, horários e contato.',
  },
  {
    value: 'turismo',
    label: 'Turismo',
    hint: 'Fale sobre pousadas, atrativos, passeios, roteiros ou cadastro de negócio turístico.',
    placeholder: 'Ex: Quero cadastrar meu rancho/pousada no guia de turismo de Carmo.',
  },
  {
    value: 'passagens',
    label: 'Passagens',
    hint: 'Descreva a dúvida sobre compra, cancelamento, rota, horário ou atendimento de passagens.',
    placeholder: 'Ex: Preciso de ajuda com uma passagem para Passos no horário das 7h.',
  },
  {
    value: 'outro',
    label: 'Outro assunto',
    hint: 'Descreva sua mensagem com contexto suficiente para a equipe entender e responder.',
    placeholder: 'Escreva sua mensagem aqui.',
  },
];

type ContactFormProps = {
  selectedType: string;
  sourcePage: string;
  subject: string;
};

function isContactSubmissionType(value: string): value is ContactSubmissionType {
  return subjectOptions.some((option) => option.value === value);
}

export function ContactForm({ selectedType, sourcePage, subject }: ContactFormProps) {
  const safeInitialType: ContactSubmissionType = isContactSubmissionType(selectedType) ? selectedType : 'correcao';
  const [currentType, setCurrentType] = useState<ContactSubmissionType>(safeInitialType);
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);
  const currentOption = useMemo(
    () => subjectOptions.find((option) => option.value === currentType) ?? subjectOptions[1],
    [currentType],
  );
  const hiddenSubject = currentType === safeInitialType && subject ? subject : currentOption.label;

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <input type="hidden" name="pagina" value={sourcePage} />
      <input type="hidden" name="assunto" value={hiddenSubject} />

      <label className="grid gap-2 text-sm font-bold text-ink-800">
        Assunto
        <select
          name="tipo"
          value={currentType}
          onChange={(event) => {
            const nextType = event.target.value;
            setCurrentType(isContactSubmissionType(nextType) ? nextType : 'correcao');
          }}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none focus:border-clay-500 focus:ring-2 focus:ring-clay-50"
        >
          {subjectOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.tipo ? <span className="text-xs font-semibold text-destructive">{state.fieldErrors.tipo}</span> : null}
      </label>

      {sourcePage ? (
        <p className="m-0 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
          Esta mensagem será vinculada à página {sourcePage}.
        </p>
      ) : null}

      <label className="grid gap-2 text-sm font-bold text-ink-800">
        Seu contato
        <input
          name="contato"
          placeholder="Seu e-mail ou WhatsApp"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:border-clay-500 focus:ring-2 focus:ring-clay-50"
        />
        {state.fieldErrors?.contato ? (
          <span className="text-xs font-semibold text-destructive">{state.fieldErrors.contato}</span>
        ) : null}
      </label>

      <label className="grid gap-2 text-sm font-bold text-ink-800">
        Mensagem
        <span className="text-xs font-semibold leading-relaxed text-ink-600">{currentOption.hint}</span>
        <textarea
          name="mensagem"
          rows={7}
          placeholder={currentOption.placeholder}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink-800 outline-none placeholder:text-ink-400 focus:border-clay-500 focus:ring-2 focus:ring-clay-50"
        />
        {state.fieldErrors?.mensagem ? (
          <span className="text-xs font-semibold text-destructive">{state.fieldErrors.mensagem}</span>
        ) : null}
      </label>

      {state.message ? (
        <p
          className={`m-0 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
            state.ok ? 'border-cerrado-200 bg-cerrado-100 text-cerrado-900' : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {state.ok ? <CheckCircle2 size={17} aria-hidden="true" /> : <AlertCircle size={17} aria-hidden="true" />}
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="w-fit bg-cerrado-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-cerrado-800"
      >
        <Send size={16} aria-hidden="true" />
        {pending ? 'Enviando...' : 'Enviar mensagem'}
      </Button>
    </form>
  );
}

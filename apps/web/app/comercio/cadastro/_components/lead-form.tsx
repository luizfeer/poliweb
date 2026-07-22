'use client';

import { useActionState } from 'react';
import { Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MaskedInput } from '@/components/public/forms/masked-input';
import type { BusinessPlan } from '@/lib/plans';
import { submitBusinessLeadAction, type LeadActionState } from '../actions';
import { PlanCards } from './plan-cards';

const initialState: LeadActionState = { ok: false, message: '' };

type Defaults = {
  contact_name?: string | null;
  email?: string | null;
  plan_slug?: string;
};

export function LeadForm({ defaults, plans }: { defaults: Defaults; plans: BusinessPlan[] }) {
  const [state, formAction, pending] = useActionState(submitBusinessLeadAction, initialState);

  return (
    <form action={formAction} className="space-y-8 p-6 md:p-8">
      <header className="border-paper-deep border-b pb-5">
        <h3 className="font-display text-ink-900 text-xl font-bold">Cadastre seu comércio</h3>
        <p className="text-ink-600 mt-1 text-sm">
          Leva 2 minutos. Você escolhe o plano, a gente confere os dados e libera sua ficha.
        </p>
      </header>

      <FormSection n={1} title="Confirme o plano" hint="30 dias sem pagar nada">
        <PlanCards plans={plans} defaultSlug={defaults.plan_slug} />
        {state.fieldErrors?.plan_slug ? (
          <p className="text-destructive mt-2 text-xs">{state.fieldErrors.plan_slug}</p>
        ) : null}
      </FormSection>

      <FormSection n={2} title="Sobre o comércio">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            className="md:col-span-2"
            label="Nome do comércio"
            name="business_name"
            required
            minLength={2}
            maxLength={160}
            placeholder="Ex: Restaurante Sabor da Roça"
            error={state.fieldErrors?.business_name}
          />
          <Field
            className="md:col-span-2"
            label="Categoria"
            optional="como você se descreveria"
            name="category_hint"
            maxLength={120}
            placeholder="restaurante mineiro · pousada · manicure · pesque-pague…"
            hint="Em texto livre. A gente organiza nas categorias do portal."
            error={state.fieldErrors?.category_hint}
          />
          <Field
            label="CPF ou CNPJ"
            name="document"
            required
            maxLength={20}
            mask="document"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            hint="Usado pra emitir a cobrança depois do mês grátis."
            error={state.fieldErrors?.document}
          />
          <Field
            label="Endereço"
            optional="opcional"
            name="address"
            maxLength={300}
            placeholder="Rua, número, bairro"
            error={state.fieldErrors?.address}
          />
          <Field
            label="Instagram"
            optional="opcional"
            name="instagram"
            maxLength={120}
            placeholder="seucomercio"
            prefixText="@"
            error={state.fieldErrors?.instagram}
          />
          <Field
            label="Site"
            optional="opcional"
            name="website"
            type="url"
            maxLength={300}
            placeholder="https://"
            error={state.fieldErrors?.website}
          />
          <div className="md:col-span-2">
            <FieldLabel
              htmlFor="message"
              label="Conte um pouco sobre seu comércio"
              optional="opcional"
            />
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={1500}
              placeholder="O que você vende, o que tem de especial, há quanto tempo está aberto…"
              className="border-ink-200 bg-paper-card text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:ring-clay-50 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        </div>
      </FormSection>

      <FormSection n={3} title="Seus dados de contato">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            className="md:col-span-2"
            label="Seu nome completo"
            name="contact_name"
            required
            minLength={2}
            maxLength={160}
            placeholder="Quem cuida do comércio"
            defaultValue={defaults.contact_name ?? ''}
            error={state.fieldErrors?.contact_name}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            required
            maxLength={320}
            placeholder="voce@email.com.br"
            defaultValue={defaults.email ?? ''}
            prefixIcon={<Mail className="size-3.5" />}
            error={state.fieldErrors?.email}
          />
          <Field
            label="Telefone"
            name="phone"
            type="tel"
            required
            minLength={8}
            maxLength={40}
            mask="phone"
            placeholder="(35) 3000-0000"
            prefixText="+55"
            error={state.fieldErrors?.phone}
          />
          <Field
            className="md:col-span-2"
            label="WhatsApp"
            optional="se for diferente do telefone"
            name="whatsapp"
            type="tel"
            maxLength={40}
            mask="phone"
            placeholder="(35) 9 9999-9999"
            prefixText="+55"
            hint="É por aqui que o cliente do portal te chama."
            error={state.fieldErrors?.whatsapp}
          />
        </div>
      </FormSection>

      <label className="border-ink-200 bg-paper-tint text-ink-900 flex items-start gap-3 rounded-lg border p-4 text-sm">
        <input name="consent" type="checkbox" required className="accent-clay-500 mt-1 size-4" />
        <span>
          Concordo em ser contatado(a) pelo Portal Carmelitano sobre a ativação do meu comércio e
          aceito a{' '}
          <a href="/privacidade" className="text-clay-600 font-semibold underline">
            política de privacidade
          </a>
          . <span className="text-clay-500">*</span>
        </span>
      </label>
      {state.fieldErrors?.consent ? (
        <p className="text-destructive text-sm">{state.fieldErrors.consent}</p>
      ) : null}

      {!state.ok && state.message ? (
        <p className="border-destructive/30 text-destructive rounded-md border bg-[#fbebeb] px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}

      <div className="border-paper-deep flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <span className="text-ink-600 inline-flex items-center gap-1.5 text-xs">
          <ShieldCheck className="text-cerrado-500 size-3.5" />
          Aprovação manual · Cancele quando quiser · LGPD
        </span>
        <Button type="submit" size="lg" className="gap-2" disabled={pending}>
          <Sparkles className="size-4" />
          {pending ? 'Enviando…' : 'Garantir meu mês grátis'}
        </Button>
      </div>
      <p className="text-ink-600 text-xs">
        Depois do envio, a gente confere o cadastro e libera a página do seu comércio. Você só
        configura o pagamento depois do mês grátis.
      </p>
    </form>
  );
}

function FormSection({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <span className="rounded-pill bg-clay-500 font-display flex size-7 items-center justify-center text-xs font-bold text-white">
          {n}
        </span>
        <h4 className="font-display text-ink-900 text-base font-semibold">{title}</h4>
        {hint ? (
          <span className="rounded-pill bg-cerrado-100 text-cerrado-700 ml-auto px-2.5 py-0.5 text-[11px] font-semibold">
            {hint}
          </span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  defaultValue?: string;
  optional?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  prefixText?: string;
  mask?: 'phone' | 'document';
  error?: string;
  className?: string;
};

function Field({
  label,
  name,
  type = 'text',
  required,
  minLength,
  maxLength,
  placeholder,
  defaultValue,
  optional,
  hint,
  prefixIcon,
  prefixText,
  mask,
  error,
  className,
}: FieldProps) {
  const id = `field-${name}`;
  const hasPrefix = Boolean(prefixIcon || prefixText);
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} label={label} required={required} optional={optional} />
      <div className="relative">
        {hasPrefix ? (
          <span className="text-ink-400 pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold">
            {prefixIcon ?? prefixText}
          </span>
        ) : null}
        {mask ? (
          <MaskedInput
            id={id}
            name={name}
            mask={mask}
            required={required}
            minLength={minLength}
            maxLength={maxLength}
            placeholder={placeholder}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            className={
              'border-ink-200 bg-paper-card text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:ring-clay-50 block w-full rounded-md border py-2 text-sm focus:outline-none focus:ring-2 ' +
              (hasPrefix ? 'pl-9 pr-3' : 'px-3') +
              (error ? 'border-destructive' : '')
            }
          />
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            required={required}
            minLength={minLength}
            maxLength={maxLength}
            placeholder={placeholder}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            className={
              'border-ink-200 bg-paper-card text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:ring-clay-50 block w-full rounded-md border py-2 text-sm focus:outline-none focus:ring-2 ' +
              (hasPrefix ? 'pl-9 pr-3' : 'px-3') +
              (error ? 'border-destructive' : '')
            }
          />
        )}
      </div>
      {hint && !error ? <p className="text-ink-400 mt-1 text-xs">{hint}</p> : null}
      {error ? <p className="text-destructive mt-1 text-xs">{error}</p> : null}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  label,
  required,
  optional,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  optional?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-ink-700 mb-1.5 flex items-center gap-1 text-xs font-semibold"
    >
      {label}
      {required ? <span className="text-clay-500">*</span> : null}
      {optional ? <span className="text-ink-400 font-normal">— {optional}</span> : null}
    </label>
  );
}

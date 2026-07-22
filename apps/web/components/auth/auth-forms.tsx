'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
import {
  requestPasswordResetAction,
  resetPasswordAction,
  type PasswordActionState,
} from '@/app/(auth)/recuperar-senha/actions';
import {
  signInAction,
  signInWithGoogleAction,
  type AuthActionState,
} from '@/app/(auth)/entrar/actions';
import { signUpAction, type SignUpActionState } from '@/app/(auth)/cadastro/actions';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.604 4.604 0 0 1-1.996 3.018v2.51h3.232c1.891-1.74 2.982-4.303 2.982-7.351z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.604 0-4.81-1.76-5.595-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.405 13.9a5.997 5.997 0 0 1 0-3.8V7.51H3.064a10.003 10.003 0 0 0 0 8.98l3.341-2.59z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 2.99 14.695 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.341 2.59C7.19 7.737 9.396 5.977 12 5.977z"
      />
    </svg>
  );
}

function GoogleButton({ label }: { label: string }) {
  return (
    <form action={signInWithGoogleAction}>
      <Button
        type="submit"
        variant="outline"
        className="w-full gap-2 border-ink-200 bg-paper-card text-ink-900 hover:bg-paper-tint"
      >
        <GoogleMark />
        {label}
      </Button>
    </form>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-400">
      <span className="h-px flex-1 bg-paper-deep" />
      ou
      <span className="h-px flex-1 bg-paper-deep" />
    </div>
  );
}

const initialAuthState: AuthActionState = { ok: false, message: '' };
const initialSignUpState: SignUpActionState = { ok: false, message: '' };
const initialPasswordState: PasswordActionState = { ok: false, message: '' };

function FormMessage({ state }: { state: { ok: boolean; message: string } }) {
  if (!state.message) return null;

  return (
    <p className={state.ok ? 'text-sm text-cerrado-700' : 'text-sm text-destructive'}>
      {state.message}
    </p>
  );
}

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialAuthState);

  return (
    <div className="space-y-5">
      <GoogleButton label="Entrar com Google" />
      <OrDivider />
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>
        <FormMessage state={state} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialSignUpState);
  const [phone, setPhone] = useState('');

  return (
    <div className="space-y-5">
      <GoogleButton label="Continuar com Google" />
      <OrDivider />
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" name="full_name" autoComplete="name" required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(35) 99999-0000"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data de nascimento</Label>
          <Input id="birth_date" name="birth_date" type="date" required />
        </div>
        <label className="flex items-start gap-2 text-sm text-ink-700">
          <input name="accept_terms" type="checkbox" required className="mt-1" />
          <span>
            Li e concordo com os{' '}
            <Link href="/termos" className="font-semibold text-clay-600 hover:underline">
              Termos de uso
            </Link>{' '}
            e a{' '}
            <Link href="/privacidade" className="font-semibold text-clay-600 hover:underline">
              Politica de Privacidade
            </Link>
            .
          </span>
        </label>
        <FormMessage state={state} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>
    </div>
  );
}

export function RequestPasswordResetForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialPasswordState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Enviando...' : 'Enviar instruções'}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialPasswordState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Salvando...' : 'Salvar nova senha'}
      </Button>
    </form>
  );
}

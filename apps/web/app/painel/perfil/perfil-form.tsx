'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Profile } from '@/lib/auth/types';
import { updateProfileAction, type ProfileActionState } from './actions';

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const initialState: ProfileActionState = { ok: false, message: '' };

export function PerfilForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [phone, setPhone] = useState(maskPhone(profile.phone ?? ''));

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="max-w-2xl space-y-4 rounded-2xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ''}
          required
          minLength={3}
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
        <Input
          id="birth_date"
          name="birth_date"
          type="date"
          defaultValue={profile.birth_date ?? ''}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ''}
          className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          name="consent_marketing"
          type="checkbox"
          defaultChecked={profile.consent_marketing ?? false}
          className="mt-1"
        />
        Aceito receber novidades e comunicações da cidade.
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar perfil'}
      </Button>
    </form>
  );
}

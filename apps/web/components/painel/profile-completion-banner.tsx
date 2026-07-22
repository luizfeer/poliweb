import Link from 'next/link';
import { UserPen } from 'lucide-react';

type Props = {
  missingPhone: boolean;
  missingBirthDate: boolean;
};

export function ProfileCompletionBanner({ missingPhone, missingBirthDate }: Props) {
  const missing: string[] = [];
  if (missingPhone) missing.push('telefone');
  if (missingBirthDate) missing.push('data de nascimento');

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <UserPen className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <p className="flex-1">
        Seu perfil está incompleto — falta{missing.length > 1 ? 'm' : ''}{' '}
        <strong>{missing.join(' e ')}</strong>.{' '}
        <Link href="/painel/perfil" className="font-semibold underline underline-offset-2 hover:text-amber-700">
          Completar agora
        </Link>
      </p>
    </div>
  );
}

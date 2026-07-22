import { ResetPasswordForm } from '@/components/auth/auth-forms';

export default function RedefinirSenhaPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Nova senha</h2>
        <p className="text-sm text-muted-foreground">Escolha uma senha com pelo menos 8 caracteres.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}

'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Store,
  Tag,
  TrendingUp,
  User as UserIcon,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  signInAction,
  signInWithGoogleAction,
  type AuthActionState,
} from '@/app/(auth)/entrar/actions';

const initialState: AuthActionState = { ok: false, message: '' };

type Mode = 'visitante' | 'comerciante';

export function SignInExperience({ cityName }: { cityName: string }) {
  const [mode, setMode] = useState<Mode>('visitante');
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[480px_1fr]">
      <LoginAside mode={mode} cityName={cityName} />

      <section className="relative flex min-h-screen flex-col px-4 py-8 md:px-10 lg:py-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-clay-600"
        >
          <ArrowLeft className="size-3.5" /> Voltar pro portal
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-clay-600">
            <span className="size-1.5 rounded-full bg-clay-500" />
            {mode === 'visitante' ? 'Entrar no portal' : 'Painel do comerciante'}
          </span>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 md:text-4xl">
            {mode === 'visitante' ? (
              <>
                De volta a <em className="italic text-clay-500">{cityName}</em>.
              </>
            ) : (
              <>
                Bem-vindo de <em className="italic text-clay-500">volta</em>.
              </>
            )}
          </h1>

          <p className="mt-3 text-ink-600">
            {mode === 'visitante'
              ? 'Entre pra salvar lugares favoritos, resgatar cupons e acompanhar o que rola na cidade.'
              : 'Entre pra ver as visitas da semana e atualizar a página do seu comércio.'}
          </p>

          <div role="tablist" className="mt-7 flex rounded-pill bg-paper-deep p-1">
            <TabButton
              active={mode === 'visitante'}
              onClick={() => setMode('visitante')}
              icon={UserIcon}
            >
              Sou visitante
            </TabButton>
            <TabButton
              active={mode === 'comerciante'}
              onClick={() => setMode('comerciante')}
              icon={Store}
            >
              Sou comerciante
            </TabButton>
          </div>

          <form action={signInWithGoogleAction} className="mt-6">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-ink-200 bg-paper-card px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-paper-tint"
            >
              <GoogleMark />
              Entrar com Google
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-400">
            <span className="h-px flex-1 bg-paper-deep" />
            ou com email
            <span className="h-px flex-1 bg-paper-deep" />
          </div>

          <form action={formAction} className="space-y-4">
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com.br"
              icon={Mail}
              required
            />

            <div>
              <label
                htmlFor="login-pass"
                className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-700"
              >
                <span>Senha</span>
                <Link
                  href="/recuperar-senha"
                  className="text-[11px] font-semibold text-sky-700 hover:underline"
                >
                  Esqueci a senha
                </Link>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">
                  <Lock className="size-3.5" />
                </span>
                <input
                  id="login-pass"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="block w-full rounded-md border border-ink-200 bg-paper-card py-2.5 pl-9 pr-11 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-600 hover:bg-paper-deep hover:text-ink-900"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {state.message && !state.ok ? (
              <p className="rounded-md border border-destructive/30 bg-[#fbebeb] px-3 py-2 text-sm text-destructive">
                {state.message}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full gap-2" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  {mode === 'visitante' ? 'Entrar no portal' : 'Entrar no painel'}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            {mode === 'comerciante' ? (
              <>
                Não tem cadastro ainda?{' '}
                <Link
                  href="/comercio/cadastro"
                  className="font-semibold text-clay-600 hover:underline"
                >
                  Cadastrar meu comércio
                </Link>
              </>
            ) : (
              <>
                Primeira vez por aqui?{' '}
                <Link href="/cadastro" className="font-semibold text-clay-600 hover:underline">
                  Criar conta
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 text-xs text-ink-400">
          <span>Portal Carmelitano</span>
          <span className="flex gap-4">
            <Link href="/privacidade" className="hover:text-ink-600">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-ink-600">
              Termos
            </Link>
          </span>
        </div>
      </section>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        'flex flex-1 items-center justify-center gap-1.5 rounded-pill px-3 py-2 text-sm font-semibold transition-colors ' +
        (active
          ? 'bg-paper-card text-ink-900 shadow-card'
          : 'text-ink-600 hover:text-ink-900')
      }
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  icon: Icon,
  required,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  icon: LucideIcon;
  required?: boolean;
}) {
  const id = `login-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">
          <Icon className="size-3.5" />
        </span>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          className="block w-full rounded-md border border-ink-200 bg-paper-card py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-50"
        />
      </div>
    </div>
  );
}

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

export function LoginAside({ mode, cityName }: { mode: Mode; cityName: string }) {
  const isVisitor = mode === 'visitante';
  return (
    <aside className="relative hidden overflow-hidden bg-ink-900 text-paper lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(circle_at_20%_20%,#e0561b_0%,transparent_45%),radial-gradient(circle_at_80%_70%,#1f4a2c_0%,transparent_50%),radial-gradient(circle_at_60%_30%,#f4b73a_0%,transparent_30%)]" />

      <div className="relative px-10 pt-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-clay-500 font-display text-sm font-bold text-white">
            C
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.25em] text-paper/60">Portal</span>
            <span className="font-display text-lg font-bold text-paper">Carmelitano</span>
          </span>
        </Link>
      </div>

      <div className="relative flex-1 px-10 py-10">
        {isVisitor ? (
          <blockquote className="font-display text-2xl font-medium italic leading-snug text-paper">
            “Achei a pousada, o restaurante e ainda peguei{' '}
            <span className="not-italic text-sun-500">15% de desconto</span> no café da manhã.
            Tudo num lugar só.”
          </blockquote>
        ) : (
          <blockquote className="font-display text-2xl font-medium italic leading-snug text-paper">
            “Em pouco tempo o pessoal já tava reservando direto pelo portal.{' '}
            <span className="not-italic text-sun-500">Mudou de patamar.</span>”
          </blockquote>
        )}

        <div className="mt-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-clay-500 text-sm font-bold text-white">
            {isVisitor ? 'MA' : 'LP'}
          </div>
          <div className="text-sm">
            <div className="font-semibold text-paper">
              {isVisitor ? 'Marina A.' : 'Lucas P.'}
            </div>
            <div className="text-paper/60">
              {isVisitor ? 'Visitante' : `Pousada em ${cityName}`}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-2.5">
          {isVisitor ? (
            <>
              <DemoCard
                icon={Heart}
                iconBg="bg-sun-500/20"
                iconFg="text-sun-300"
                title="Pousada Mirante"
                sub="Salva nos seus favoritos"
              />
              <DemoCard
                icon={Tag}
                iconBg="bg-[#c81e4a]/25"
                iconFg="text-[#f8b4c5]"
                title="ARARA15 · 15% off"
                sub="Café Arara · resgata até dia 30"
                live
              />
              <DemoCard
                icon={MapPin}
                iconBg="bg-cerrado-500/30"
                iconFg="text-cerrado-100"
                title="Trilha do Mirante"
                sub="A 3,2 km de você · aberta hoje"
              />
            </>
          ) : (
            <>
              <DemoCard
                icon={TrendingUp}
                iconBg="bg-clay-500/25"
                iconFg="text-clay-100"
                title="+312 visitas"
                sub="Pousada Mirante · 7 dias"
                live
              />
              <DemoCard
                icon={Tag}
                iconBg="bg-[#c81e4a]/25"
                iconFg="text-[#f8b4c5]"
                title="Cupons resgatados"
                sub="Café Arara · ARARA15"
                live
              />
              <DemoCard
                icon={BarChart3}
                iconBg="bg-cerrado-500/30"
                iconFg="text-cerrado-100"
                title="Buscas pela sua página"
                sub={<MiniSpark />}
              />
            </>
          )}
        </div>
      </div>

      <div className="relative grid grid-cols-3 gap-4 border-t border-paper/10 px-10 py-6">
        {(isVisitor ? VISITOR_STATS : MERCHANT_STATS).map((s) => (
          <div key={s.l}>
            <div className="font-display text-xl font-extrabold text-sun-500">{s.v}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-paper/60">{s.l}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

const VISITOR_STATS = [
  { v: 'Lugares', l: 'Pra você descobrir' },
  { v: 'Cupons', l: 'Da cidade pra você' },
  { v: 'Avisos', l: 'Do que rola na praça' },
];

const MERCHANT_STATS = [
  { v: 'Vitrine', l: 'Da cidade inteira' },
  { v: 'Painel', l: 'Pra editar quando quiser' },
  { v: 'Suporte', l: 'Humano no WhatsApp' },
];

function DemoCard({
  icon: Icon,
  iconBg,
  iconFg,
  title,
  sub,
  live,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconFg: string;
  title: string;
  sub: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-paper/10 bg-paper/5 p-3 backdrop-blur-sm">
      <span
        className={
          'flex size-9 shrink-0 items-center justify-center rounded-pill ' + iconBg + ' ' + iconFg
        }
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-paper">{title}</div>
        <div className="text-xs text-paper/60">{sub}</div>
      </div>
      {live ? (
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-cerrado-300/70" />
          <span className="relative inline-flex size-2 rounded-full bg-cerrado-300" />
        </span>
      ) : null}
    </div>
  );
}

function MiniSpark() {
  return (
    <span className="mt-1 flex items-end gap-0.5">
      {[10, 16, 8, 22, 28, 18, 24].map((h, i) => (
        <span
          key={i}
          className="block w-1 rounded-sm bg-sun-500"
          style={{ height: `${h}px`, opacity: 0.5 + i / 14 }}
        />
      ))}
    </span>
  );
}

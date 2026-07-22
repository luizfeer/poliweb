import { Link } from '@/components/navigation/link';

export const metadata = {
  title: 'LGPD | Portal Carmelitano',
  description: 'Canal de privacidade e direitos do titular no Portal Carmelitano.',
};

export default function LgpdPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:py-14">
      <header className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay-600">
          {'Privacidade e LGPD'}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink-900 md:text-5xl">
          {'Seus direitos sobre dados pessoais'}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-700">
          Use este canal para pedir acesso, correção, exclusão, portabilidade ou informações sobre
          o uso dos seus dados no Portal Carmelitano.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          title="Responsável"
          text="CidadeViva, nome fantasia de LUIZ FERNANDO FERREIRA DE ALMEIDA, CNPJ 65.205.651/0001-63."
        />
        <InfoCard
          title="Canal oficial"
          text="Envie sua solicitação pelo email contato@cidadeviva.com.br com o assunto Solicitação LGPD."
        />
        <InfoCard
          title="Prazo de retorno"
          text="A equipe analisa o pedido, confirma identidade quando necessário e responde pelo canal informado."
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card md:p-7">
          <h2 className="text-2xl font-semibold text-ink-900">Solicitações disponíveis</h2>
          <ul className="mt-5 grid gap-3 text-sm leading-relaxed text-ink-700">
            <RequestItem
              title="Acesso e confirmação"
              text="Saber se tratamos seus dados pessoais e receber uma cópia das informações associadas a você."
            />
            <RequestItem
              title="Correção"
              text="Atualizar dados incompletos, inexatos ou desatualizados."
            />
            <RequestItem
              title="Exclusão ou anonimização"
              text="Pedir a remoção de dados quando a lei permitir e quando eles não forem mais necessários para operar o serviço."
            />
            <RequestItem
              title="Portabilidade e compartilhamento"
              text="Solicitar informações sobre uso, origem e eventual compartilhamento com fornecedores essenciais."
            />
            <RequestItem
              title="Revogação de consentimento"
              text="Retirar permissões opcionais, como comunicações e preferências de contato."
            />
          </ul>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card md:p-6">
            <h2 className="text-xl font-semibold text-ink-900">Como solicitar</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink-700">
              <li>
                <strong>1. Informe o pedido:</strong>{' '}
                acesso, correção, exclusão, portabilidade ou revogação.
              </li>
              <li>
                <strong>2. Identifique sua conta:</strong>{' '}
                {'envie o email ou telefone usado no portal.'}
              </li>
              <li>
                <strong>3. Aguarde a conferência:</strong> podemos pedir confirmação de identidade antes de
                entregar ou alterar dados.
              </li>
            </ol>
            <a
              href="mailto:contato@cidadeviva.com.br?subject=Solicita%C3%A7%C3%A3o%20LGPD"
              className="mt-5 inline-flex rounded-lg bg-clay-500 px-4 py-2 text-sm font-bold text-white hover:bg-clay-600 hover:text-white hover:no-underline"
            >
              Enviar solicitação LGPD
            </a>
          </section>

          <section className="rounded-2xl border border-ink-100 bg-paper-deep p-5 md:p-6">
            <h2 className="text-xl font-semibold text-ink-900">Atalhos úteis</h2>
            <div className="mt-4 grid gap-2 text-sm font-semibold">
              <Link href="/privacidade" className="text-sky-700 underline-offset-4 hover:underline">
                Ler a política de privacidade
              </Link>
              <Link href="/excluir-conta" className="text-sky-700 underline-offset-4 hover:underline">
                Solicitar exclusão de conta
              </Link>
            </div>
          </section>
        </aside>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-100/60 p-5 text-sm leading-relaxed text-sky-900">
        <h2 className="text-lg font-semibold text-sky-900">Observação importante</h2>
        <p className="mt-2">
          Nem todo dado pode ser apagado imediatamente. Algumas informações precisam ser mantidas por
          obrigação legal, segurança, prevenção de fraude, auditoria ou defesa de direitos. Quando
          isso acontecer, a resposta explicará o motivo de forma objetiva.
        </p>
      </section>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{text}</p>
    </section>
  );
}

function RequestItem({ title, text }: { title: string; text: string }) {
  return (
    <li className="rounded-xl bg-paper px-4 py-3">
      <strong className="text-ink-900">{title}:</strong> {text}
    </li>
  );
}

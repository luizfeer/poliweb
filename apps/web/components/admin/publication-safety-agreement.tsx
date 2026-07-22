import { ShieldAlert } from 'lucide-react';

type PublicationSafetyAgreementProps = {
  name?: string;
};

export function PublicationSafetyAgreement({
  name = 'safety_terms_accepted',
}: PublicationSafetyAgreementProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Termo de responsabilidade e segurança</h2>
            <p className="mt-1 text-sm leading-relaxed">
              Ao publicar, você confirma que as informações são verdadeiras, que tem direito de
              divulgar fotos, vídeos, preço e contato, e que responderá por negociações feitas a
              partir do anúncio.
            </p>
          </div>
          <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed">
            <li>Não publique dados de terceiros sem autorização.</li>
            <li>Não anuncie produto, serviço ou imóvel inexistente, irregular ou com preço enganoso.</li>
            <li>Avise sobre defeitos, restrições, taxas, dívidas, documentos pendentes e condições reais.</li>
            <li>Nunca peça pagamento antecipado sem contrato, comprovante e verificação entre as partes.</li>
            <li>O portal pode remover, revisar ou bloquear anúncios com indício de golpe, abuso ou informação falsa.</li>
          </ul>
          <label className="flex items-start gap-2 rounded-xl border border-amber-300 bg-white/70 p-3 text-sm font-medium">
            <input name={name} type="checkbox" required className="mt-1" />
            <span>
              Li e aceito publicar com responsabilidade, manter dados corretos e orientar o
              interessado a conferir valores, documentos e condições antes de qualquer pagamento.
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}

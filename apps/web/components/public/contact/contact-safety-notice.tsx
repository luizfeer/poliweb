import { ShieldCheck } from 'lucide-react';

export function ContactSafetyNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold">Cuidado antes de negociar</p>
          <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed">
            <li>Confira valores, estado do item/imóvel e identidade do anunciante.</li>
            <li>Desconfie de pressa, sinal antecipado, preço muito abaixo do mercado ou entrega sem vistoria.</li>
            <li>Combine em local seguro e guarde comprovantes da conversa e do pagamento.</li>
            <li>O portal aproxima pessoas da cidade, mas a negociação e a verificação são responsabilidade dos envolvidos.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

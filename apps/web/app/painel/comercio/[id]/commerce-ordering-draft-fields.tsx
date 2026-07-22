'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type DraftOffering = {
  kind: 'service' | 'product';
  name: string;
  description: string;
  price: string;
};

type CommerceOrderingDraftFieldsProps = {
  offerings: DraftOffering[];
};

const emptyOffering: DraftOffering = {
  kind: 'product',
  name: '',
  description: '',
  price: '',
};

export function CommerceOrderingDraftFields({ offerings }: CommerceOrderingDraftFieldsProps) {
  const [rows, setRows] = useState<DraftOffering[]>(offerings.length > 0 ? offerings : [emptyOffering]);

  return (
    <div className="grid gap-3">
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 rounded-xl border border-ink-100 bg-white p-3 md:grid-cols-[140px_minmax(0,1fr)_120px_auto]">
          <select
            className="min-w-0 rounded-lg border border-ink-200 px-3 py-2 text-sm"
            name="offering_kind"
            defaultValue={row.kind}
          >
            <option value="product">Produto</option>
            <option value="service">Serviço</option>
          </select>
          <div className="grid min-w-0 gap-2">
            <input
              className="min-w-0 rounded-lg border border-ink-200 px-3 py-2 text-sm"
              name="offering_name"
              defaultValue={row.name}
              placeholder="Nome do item"
            />
            <input
              className="min-w-0 rounded-lg border border-ink-200 px-3 py-2 text-sm"
              name="offering_description"
              defaultValue={row.description}
              placeholder="Descrição curta"
            />
          </div>
          <input
            className="min-w-0 rounded-lg border border-ink-200 px-3 py-2 text-sm"
            name="offering_price"
            defaultValue={row.price}
            placeholder="R$"
          />
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
            disabled={rows.length === 1}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span className="md:sr-only">Remover</span>
          </button>
        </div>
      ))}

      <button
        type="button"
        className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-medium hover:bg-clay-50"
        onClick={() => setRows((current) => [...current, emptyOffering])}
      >
        <Plus className="size-4" aria-hidden="true" />
        Adicionar produto ou serviço
      </button>
    </div>
  );
}

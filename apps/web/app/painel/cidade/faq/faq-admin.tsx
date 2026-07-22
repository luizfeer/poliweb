'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Pencil, X, Check } from 'lucide-react';
import { deleteFaqAction, toggleFaqAction, upsertFaqAction } from './actions';

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
};

type Props = { faqs: FaqRow[] };

export function FaqAdmin({ faqs: initial }: Props) {
  const [faqs, setFaqs] = useState(initial);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState({ question: '', answer: '' });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setForm({ question: '', answer: '' });
    setEditing('new');
    setError(null);
  }

  function startEdit(faq: FaqRow) {
    setForm({ question: faq.question, answer: faq.answer });
    setEditing(faq.id);
    setError(null);
  }

  function cancel() {
    setEditing(null);
    setError(null);
  }

  function save() {
    startTransition(async () => {
      const result = await upsertFaqAction({
        id: editing === 'new' ? undefined : editing,
        ...form,
      });
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar.');
        return;
      }
      setEditing(null);
      window.location.reload();
    });
  }

  function toggle(id: string, isActive: boolean) {
    startTransition(async () => {
      await toggleFaqAction({ id, isActive: !isActive });
      setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, is_active: !f.is_active } : f)));
    });
  }

  function remove(id: string) {
    if (!confirm('Remover esta entrada do FAQ?')) return;
    startTransition(async () => {
      await deleteFaqAction({ id });
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <button
        onClick={startNew}
        disabled={!!editing}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity disabled:opacity-50"
      >
        <Plus size={15} /> Nova entrada
      </button>

      {editing === 'new' && (
        <FaqForm form={form} onChange={setForm} onSave={save} onCancel={cancel} error={error} isPending={isPending} />
      )}

      {faqs.length === 0 && editing !== 'new' && (
        <p className="text-sm text-muted-foreground">Nenhuma entrada ainda.</p>
      )}

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="rounded-xl border border-border bg-background p-4">
            {editing === faq.id ? (
              <FaqForm form={form} onChange={setForm} onSave={save} onCancel={cancel} error={error} isPending={isPending} />
            ) : (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{faq.question}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => toggle(faq.id, faq.is_active)} disabled={isPending} title={faq.is_active ? 'Desativar' : 'Ativar'} className="rounded p-1 text-muted-foreground hover:text-foreground">
                      {faq.is_active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => startEdit(faq)} disabled={isPending} title="Editar" className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(faq.id)} disabled={isPending} title="Remover" className="rounded p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
                {!faq.is_active && (
                  <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">inativo</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqForm({
  form,
  onChange,
  onSave,
  onCancel,
  error,
  isPending,
}: {
  form: { question: string; answer: string };
  onChange: (f: { question: string; answer: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  error: string | null;
  isPending: boolean;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-muted/30 p-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Pergunta</label>
        <input
          value={form.question}
          onChange={(e) => onChange({ ...form, question: e.target.value })}
          placeholder="Ex: Quais são os horários da Prefeitura?"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Resposta</label>
        <textarea
          value={form.answer}
          onChange={(e) => onChange({ ...form, answer: e.target.value })}
          placeholder="Resposta completa que o assistente vai usar…"
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onSave} disabled={isPending || !form.question.trim() || !form.answer.trim()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50">
          <Check size={13} /> Salvar
        </button>
        <button onClick={onCancel} disabled={isPending} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50">
          <X size={13} /> Cancelar
        </button>
      </div>
    </div>
  );
}

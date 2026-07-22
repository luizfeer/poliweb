'use client';

import { useActionState } from 'react';
import { useState } from 'react';
import { enterRaffleAction, type EnterRaffleResult } from '@/app/(public)/sorteios/actions';

type Props = {
  raffleId: string;
  entryCostPoints: number;
  maxEntries: number;
  remainingEntries: number;
  userBalance: number;
};

const initialState: EnterRaffleResult = { ok: false, message: '' };

export function RaffleEntryForm({
  raffleId,
  entryCostPoints,
  maxEntries,
  remainingEntries,
  userBalance,
}: Props) {
  const [state, formAction, pending] = useActionState(enterRaffleAction, initialState);
  const maxAffordable = Math.floor(userBalance / entryCostPoints);
  const cap = Math.min(remainingEntries, maxAffordable, maxEntries);
  const [count, setCount] = useState(1);
  const totalCost = count * entryCostPoints;

  if (remainingEntries <= 0) {
    return (
      <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        Você já atingiu o limite de {maxEntries} {maxEntries === 1 ? 'entrada' : 'entradas'} neste sorteio. Boa sorte!
      </div>
    );
  }

  if (cap <= 0) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        Você precisa de pelo menos {entryCostPoints} pontos para entrar. Convide amigos para ganhar mais.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="raffle_id" value={raffleId} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCount(Math.max(1, count - 1))}
          className="h-10 w-10 rounded-lg border text-lg hover:bg-muted disabled:opacity-50"
          disabled={count <= 1}
          aria-label="Diminuir"
        >
          −
        </button>
        <input
          type="number"
          name="entries_count"
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(cap, parseInt(e.target.value, 10) || 1)))}
          min={1}
          max={cap}
          className="h-10 w-20 rounded-lg border bg-background text-center text-lg tabular-nums"
        />
        <button
          type="button"
          onClick={() => setCount(Math.min(cap, count + 1))}
          className="h-10 w-10 rounded-lg border text-lg hover:bg-muted disabled:opacity-50"
          disabled={count >= cap}
          aria-label="Aumentar"
        >
          +
        </button>
        <span className="text-sm text-muted-foreground">
          {count === 1 ? 'entrada' : 'entradas'} × {entryCostPoints} pts = <strong className="text-foreground">{totalCost} pts</strong>
        </span>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {pending ? 'Enviando…' : `Entrar no sorteio (${totalCost} pts)`}
      </button>

      {state.message && (
        <p
          className={
            state.ok
              ? 'rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
              : 'rounded-lg bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

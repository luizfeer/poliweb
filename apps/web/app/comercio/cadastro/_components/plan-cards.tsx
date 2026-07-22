'use client';

import { useState } from 'react';
import { Check, Gift, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BusinessPlan } from '@/lib/plans';
import { formatPlanPrice } from '@/lib/plans';

type Props = {
  plans: BusinessPlan[];
  defaultSlug?: string;
};

export function PlanCards({ plans, defaultSlug }: Props) {
  const firstActive = plans.find((p) => p.status === 'active');
  const initialSlug =
    defaultSlug && plans.some((p) => p.slug === defaultSlug && p.status === 'active')
      ? defaultSlug
      : firstActive?.slug ?? plans[0]?.slug ?? '';
  const [selected, setSelected] = useState(initialSlug);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {plans.map((plan) => {
        const isActive = plan.status === 'active';
        const isSelected = selected === plan.slug && isActive;
        return (
          <label
            key={plan.slug}
            className={cn(
              'relative flex cursor-pointer flex-col rounded-xl border-2 bg-paper-card p-4 transition-all',
              isSelected
                ? 'border-clay-500 bg-clay-50'
                : 'border-paper-deep hover:border-clay-300',
              plan.highlight && isActive && !isSelected && 'border-clay-300',
              !isActive && 'cursor-not-allowed opacity-70',
            )}
          >
            <input
              type="radio"
              name="plan_slug"
              value={plan.slug}
              checked={isSelected}
              onChange={() => setSelected(plan.slug)}
              disabled={!isActive}
              className="sr-only"
              required={isActive}
            />
            {plan.highlight && isActive ? (
              <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-pill bg-clay-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-banner">
                <Sparkles className="size-3" /> Mais popular
              </span>
            ) : null}
            {!isActive ? (
              <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-pill bg-paper-deep px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-600">
                Em breve
              </span>
            ) : null}

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display text-base font-bold text-ink-900">{plan.name}</div>
                <div className="mt-0.5 text-xs leading-snug text-ink-600">{plan.description}</div>
              </div>
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                  isSelected
                    ? 'border-clay-500 bg-clay-500 text-white'
                    : 'border-ink-300 bg-paper-card',
                )}
              >
                {isSelected ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-2xl font-extrabold text-ink-900">
                {formatPlanPrice(plan.monthlyValueCents)}
              </span>
              <span className="text-xs text-ink-600">/mês</span>
            </div>

            <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-pill bg-cerrado-100 px-2 py-0.5 text-[10px] font-semibold text-cerrado-700">
              <Gift className="size-2.5" /> 30 dias grátis
            </div>

            <ul className="mt-3 space-y-1 text-xs text-ink-900">
              {plan.features.slice(0, 4).map((feature) => (
                <li key={feature} className="flex items-start gap-1.5">
                  <Check className="mt-0.5 size-3 shrink-0 text-clay-500" strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </label>
        );
      })}
    </div>
  );
}

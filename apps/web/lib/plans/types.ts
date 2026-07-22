export type PlanStatus = 'active' | 'coming_soon' | 'archived';

export type BusinessPlan = {
  slug: string;
  name: string;
  description: string;
  monthlyValueCents: number;
  features: string[];
  highlight: boolean;
  displayOrder: number;
  status: PlanStatus;
};

export function formatPlanPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

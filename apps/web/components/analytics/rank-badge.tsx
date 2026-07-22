import { Trophy } from 'lucide-react';

type RankBadgeProps = {
  pctile: number;
  categoryName?: string;
  districtName?: string;
  districtRank?: number;
  districtTotal?: number;
};

export function RankBadge({ pctile, categoryName, districtName, districtRank, districtTotal }: RankBadgeProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Trophy size={16} className="text-yellow-500" />
        <span>Você está no top {pctile}%</span>
      </div>
      {categoryName && (
        <p className="mt-1 text-sm text-muted-foreground">
          em &quot;{categoryName}&quot; esta semana
        </p>
      )}
      {districtName && districtRank && districtTotal && (
        <p className="mt-1 text-sm text-muted-foreground">
          Bairro {districtName}: posição #{districtRank} de {districtTotal}
        </p>
      )}
    </div>
  );
}

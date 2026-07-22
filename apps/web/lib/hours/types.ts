export type EntityHoursRow = {
  id: string;
  entityType: string;
  entityId: string;
  cityId: string;
  weekday: number;
  startsAt: string;
  endsAt: string | null;
  kind: 'regular' | 'exception';
  validFrom: string | null;
  validUntil: string | null;
  note: string | null;
  sourceStatus: 'confirmed' | 'needs_verification';
  active: boolean;
};

export type HoursStatus = {
  open: boolean;
  current?: {
    start: string;
    end: string | null;
  };
  nextChange: Date | null;
  nextOpening?: {
    weekday: number;
    start: string;
  };
  sourceStatus: 'confirmed' | 'needs_verification';
};

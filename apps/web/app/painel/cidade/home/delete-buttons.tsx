'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  confirmMessage: string;
  label: string;
};

export function ConfirmDeleteForm({ action, hiddenFields, confirmMessage, label }: Props) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <Button type="submit" variant="ghost" size="icon" className="text-destructive" aria-label={label}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}

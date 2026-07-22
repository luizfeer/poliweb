'use client';

import { createContext, useContext, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

const SubmitOnceContext = createContext(false);

type SubmitOnceFormProps = FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode;
};

export function SubmitOnceForm({ children, onSubmit, ...props }: SubmitOnceFormProps) {
  const [locked, setLocked] = useState(false);

  return (
    <SubmitOnceContext.Provider value={locked}>
      <form
        {...props}
        onSubmit={(event) => {
          if (locked) {
            event.preventDefault();
            return;
          }
          onSubmit?.(event);
          if (!event.defaultPrevented) {
            setLocked(true);
          }
        }}
      >
        {children}
      </form>
    </SubmitOnceContext.Provider>
  );
}

type SubmitOnceButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
  icon?: ReactNode;
};

export function SubmitOnceButton({
  label,
  pendingLabel = 'Salvando...',
  className,
  icon,
}: SubmitOnceButtonProps) {
  const locked = useContext(SubmitOnceContext);
  const { pending } = useFormStatus();
  const disabled = locked || pending;

  return (
    <button
      type="submit"
      disabled={disabled}
      aria-busy={disabled}
      className={className}
    >
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {disabled ? pendingLabel : label}
    </button>
  );
}

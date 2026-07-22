'use client';

import { useMemo, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

type MaskKind = 'phone' | 'document' | 'currency';

type MaskedInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue'> & {
  name: string;
  mask: MaskKind;
  defaultValue?: string | number | null;
};

export function MaskedInput({
  name,
  mask,
  defaultValue,
  className,
  onChange,
  ...props
}: MaskedInputProps) {
  const initialDisplayValue = useMemo(
    () => formatByMask(String(defaultValue ?? ''), mask),
    [defaultValue, mask],
  );
  const [displayValue, setDisplayValue] = useState(initialDisplayValue);
  const normalizedValue = normalizeByMask(displayValue, mask);

  if (mask === 'currency') {
    return (
      <>
        <input type="hidden" name={name} value={normalizedValue} />
        <input
          {...props}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={(event) => {
            setDisplayValue(formatCurrency(event.target.value));
            onChange?.(event);
          }}
          className={className}
        />
      </>
    );
  }

  return (
    <input
      {...props}
      name={name}
      type="tel"
      inputMode={mask === 'document' ? 'numeric' : 'tel'}
      value={displayValue}
      onChange={(event) => {
        setDisplayValue(formatByMask(event.target.value, mask));
        onChange?.(event);
      }}
      className={className}
    />
  );
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatByMask(value: string, mask: MaskKind): string {
  if (mask === 'phone') return formatPhone(value);
  if (mask === 'document') return formatDocument(value);
  return formatCurrency(value);
}

function normalizeByMask(value: string, mask: MaskKind): string {
  if (mask === 'currency') return normalizeCurrency(value);
  return value;
}

function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDocument(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

function formatCurrency(value: string): string {
  const digits = onlyDigits(value).slice(0, 10);
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

function normalizeCurrency(value: string): string {
  const digits = onlyDigits(value);
  if (!digits) return '';
  return (Number(digits) / 100).toFixed(2);
}

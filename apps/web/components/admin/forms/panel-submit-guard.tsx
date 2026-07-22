'use client';

import { useEffect } from 'react';

const RESTORE_AFTER_MS = 45000;

export function PanelSubmitGuard() {
  useEffect(() => {
    function restore(button: HTMLButtonElement, label: string | null) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.classList.remove('cursor-wait', 'opacity-75');
      if (label !== null) button.textContent = label;
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.dataset.submitGuard === 'off') return;
      if ((form.getAttribute('method') ?? '').toLowerCase() === 'get') return;

      const submitter = event.submitter;
      if (!(submitter instanceof HTMLButtonElement)) return;
      if (submitter.disabled) {
        event.preventDefault();
        return;
      }

      const originalLabel = submitter.querySelector('svg') ? null : submitter.textContent;
      submitter.disabled = true;
      submitter.setAttribute('aria-busy', 'true');
      submitter.classList.add('cursor-wait', 'opacity-75');
      if (originalLabel !== null) submitter.textContent = submitter.dataset.loadingLabel ?? 'Enviando...';

      window.setTimeout(() => {
        if (document.body.contains(submitter) && submitter.disabled) {
          restore(submitter, originalLabel);
        }
      }, RESTORE_AFTER_MS);
    }

    document.addEventListener('submit', onSubmit, true);
    return () => document.removeEventListener('submit', onSubmit, true);
  }, []);

  return null;
}

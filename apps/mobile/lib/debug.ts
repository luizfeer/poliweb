export function mobileDebug(scope: string, message: string, details?: unknown): void {
  if (!__DEV__) return;

  const prefix = `[mobile:${scope}] ${message}`;
  if (typeof details === 'undefined') {
    console.info(prefix);
    return;
  }

  console.info(prefix, details);
}


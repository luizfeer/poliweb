import crypto from 'node:crypto';

export function buildProcessedPath(input: {
  citySlug: string;
  entityType: string;
  entityId: string;
  role: string;
  outputExtension: 'webp' | 'mp4';
  unique: boolean;
}) {
  const basename = input.unique ? crypto.randomUUID() : input.role;
  return `${input.citySlug}/${input.entityType}/${input.entityId}/${input.role}/${basename}.${input.outputExtension}`;
}

import crypto from 'node:crypto';
export function buildProcessedPath(input) {
    const basename = input.unique ? crypto.randomUUID() : input.role;
    return `${input.citySlug}/${input.entityType}/${input.entityId}/${input.role}/${basename}.${input.outputExtension}`;
}

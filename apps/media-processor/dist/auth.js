import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env.js';
export function authorize(headerValue) {
    if (!headerValue) {
        throw new HttpError(401, 'missing authorization');
    }
    const bearer = headerValue.replace(/^Bearer\s+/i, '');
    if (!bearer)
        throw new HttpError(401, 'missing bearer');
    if (bearer.startsWith('t:')) {
        return { kind: 'token', payload: verifyToken(bearer.slice(2)) };
    }
    if (bearer === env.MEDIA_PROCESSOR_SECRET) {
        return { kind: 'static' };
    }
    throw new HttpError(401, 'invalid credentials');
}
function verifyToken(token) {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64)
        throw new HttpError(401, 'malformed token');
    const expected = signString(payloadB64, env.MEDIA_PROCESSOR_SECRET);
    const a = Buffer.from(sigB64, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new HttpError(401, 'invalid signature');
    }
    let payload;
    try {
        payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    }
    catch {
        throw new HttpError(401, 'invalid payload');
    }
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
        throw new HttpError(401, 'expired token');
    }
    return payload;
}
function signString(input, secret) {
    return createHmac('sha256', secret).update(input).digest('base64url');
}
export class HttpError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

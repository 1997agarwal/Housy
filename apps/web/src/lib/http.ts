import { NextResponse } from 'next/server';
import { AuthError } from './auth';
import { SmsUnavailableError } from './sms';
import { ConflictError, NotFoundError, ValidationError } from './projects';
import { NoCoverageError } from './pros';
import { ProfileError } from './profile';
import { RateLimitedError } from './chat';
import { PlanError } from './plan-shared';
import { PartnerError } from './partners-shared';

export class PayloadTooLargeError extends Error {}

// Reads a JSON object body while enforcing a byte cap DURING the read (Content-Length can be missing or a lie),
// so an attacker can't make the server buffer megabytes just to reject them afterwards.
export async function readBody(req: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw new PayloadTooLargeError('Request is too large');
  const reader = req.body?.getReader();
  if (!reader) throw new ValidationError('Request body is required');
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel().catch(() => undefined); throw new PayloadTooLargeError('Request is too large'); }
    chunks.push(value);
  }
  let parsed: unknown;
  try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ValidationError('Request body is not valid JSON'); }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ValidationError('Request body must be a JSON object');
  return parsed as Record<string, unknown>;
}

// One place that maps domain errors to HTTP. Unknown errors are rethrown (→ 500) rather than leaked.
export function errorResponse(e: unknown): NextResponse {
  const status =
    e instanceof AuthError ? e.status :
    e instanceof ValidationError || e instanceof PartnerError || e instanceof ProfileError || e instanceof PlanError || e instanceof SyntaxError ? 400 :
    e instanceof NotFoundError ? 404 :
    e instanceof ConflictError || e instanceof NoCoverageError ? 409 :
    e instanceof PayloadTooLargeError ? 413 :
    e instanceof RateLimitedError ? 429 :
    e instanceof SmsUnavailableError ? 503 : 0;
  if (!status) throw e;
  return NextResponse.json({ error: (e as Error).message }, { status });
}

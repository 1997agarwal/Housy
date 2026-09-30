import { NextResponse } from 'next/server';
import { AuthError } from './auth';
import { SmsUnavailableError } from './sms';
import { ConflictError, NotFoundError, ValidationError } from './projects';
import { NoCoverageError } from './pros';
import { ProfileError } from './profile';

// One place that maps domain errors to HTTP. Unknown errors are rethrown (→ 500) rather than leaked.
export function errorResponse(e: unknown): NextResponse {
  const status =
    e instanceof AuthError ? e.status :
    e instanceof ValidationError || e instanceof ProfileError || e instanceof SyntaxError ? 400 :
    e instanceof NotFoundError ? 404 :
    e instanceof ConflictError || e instanceof NoCoverageError ? 409 :
    e instanceof SmsUnavailableError ? 503 : 0;
  if (!status) throw e;
  return NextResponse.json({ error: (e as Error).message }, { status });
}

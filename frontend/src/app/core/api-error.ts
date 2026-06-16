import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns an API error into human-readable, field-aware messages.
 * Parses the backend's RFC 7807 ProblemDetails: per-field `errors` + `detail`.
 * Infrastructure failures (status 0 / 5xx / 429) get an honest message — never a
 * misleading "check your credentials".
 */
export function parseApiError(error: unknown, fallback: string): string[] {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0)
      return ['Network error — the server is unreachable. It may be waking up; please try again.'];
    if (error.status === 429) return ['Too many attempts. Please wait a moment and try again.'];

    const problem = error.error as
      | { errors?: Record<string, string[]>; detail?: string; title?: string }
      | undefined;
    if (problem && typeof problem === 'object') {
      const messages: string[] = [];
      if (problem.errors && typeof problem.errors === 'object') {
        for (const field of Object.values(problem.errors)) {
          if (Array.isArray(field)) messages.push(...field);
        }
      }
      if (messages.length === 0 && typeof problem.detail === 'string') messages.push(problem.detail);
      if (messages.length === 0 && typeof problem.title === 'string' && error.status < 500)
        messages.push(problem.title);
      if (messages.length > 0) return messages;
    }

    if (error.status >= 500)
      return ['The server had a problem handling that. Please try again shortly.'];
  }
  return [fallback];
}

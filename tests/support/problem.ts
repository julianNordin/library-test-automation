import { expect } from '@playwright/test'
import type { APIResponse } from '@playwright/test'
import type { ProblemDetails, ValidationProblemDetails } from './types'

/**
 * Reads an RFC 7807 body, checking the status and title on the way through.
 *
 * The content-type check is not decoration. The API builds these bodies as `ProblemDetails` but
 * writes them with `WriteAsJsonAsync`, which labels them `application/json` rather than
 * `application/problem+json`. The client relies on that: it decides whether an error body is
 * worth parsing by looking at the header, and a check narrowed to the more specific type would
 * silently reduce every message a user sees to the bare status text. Pinning the header here is
 * what makes that a caught regression rather than a mysterious one.
 */
export async function expectProblem(
  response: APIResponse,
  status: number,
  title: string,
): Promise<ProblemDetails> {
  expect(response.status()).toBe(status)
  expect(response.headers()['content-type']).toContain('application/json')

  const problem = (await response.json()) as ProblemDetails
  expect(problem).toMatchObject({ status, title })

  return problem
}

/**
 * Reads a validation failure, which is a different shape from the one above: it comes from
 * `[ApiController]` model validation rather than from the API's exception handler, and carries a
 * per-field `errors` dictionary keyed by the property name.
 */
export async function expectValidationProblem(
  response: APIResponse,
): Promise<ValidationProblemDetails> {
  expect(response.status()).toBe(400)
  expect(response.headers()['content-type']).toContain('application/json')

  const problem = (await response.json()) as ValidationProblemDetails
  expect(problem.title).toBe('One or more validation errors occurred.')
  expect(problem.errors).toBeDefined()

  return problem
}

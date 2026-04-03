import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { apiClient } from './apiClient'
import type { ApiError } from './apiClient'

async function captureError(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request
  } catch (error) {
    return error as ApiError
  }
  throw new Error('Expected the request to reject')
}

describe('apiClient error parsing', () => {
  it('surfaces title and detail from an application/json body, which is what P1 sends', async () => {
    server.use(
      http.get('/api/probe', () =>
        HttpResponse.json(
          {
            status: 409,
            title: 'Loan limit exceeded',
            detail: 'Member 1 already has 5 active loans.',
          },
          { status: 409 },
        ),
      ),
    )

    const error = await captureError(apiClient.get('/api/probe'))

    expect(error.status).toBe(409)
    expect(error.title).toBe('Loan limit exceeded')
    expect(error.detail).toBe('Member 1 already has 5 active loans.')
  })

  it('also reads an application/problem+json body', async () => {
    server.use(
      http.get('/api/probe', () =>
        HttpResponse.json(
          { status: 404, title: 'Resource not found', detail: 'Book 99 was not found.' },
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const error = await captureError(apiClient.get('/api/probe'))

    expect(error.title).toBe('Resource not found')
    expect(error.detail).toBe('Book 99 was not found.')
  })

  it('falls back to the status when the error carries no body, as P1 bare 404s do', async () => {
    server.use(http.get('/api/probe', () => new HttpResponse(null, { status: 404 })))

    const error = await captureError(apiClient.get('/api/probe'))

    expect(error.status).toBe(404)
    expect(error.detail).toBeUndefined()
  })

  it('does not throw a parse error when a JSON-typed error body is unreadable', async () => {
    server.use(
      http.get('/api/probe', () =>
        HttpResponse.text('gateway exploded', {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const error = await captureError(apiClient.get('/api/probe'))

    expect(error.status).toBe(502)
    expect(error.detail).toBeUndefined()
  })
})

/**
 * Reads a timestamp the way the API means it.
 *
 * The API stores UTC, but the `DateTime` values it reads back out of SQL Server have a `Kind` of
 * `Unspecified`, and System.Text.Json serialises those without a trailing `Z`:
 *
 *     "borrowedDate": "2026-04-17T19:13:17.921"
 *
 * JavaScript reads a date-time string carrying no offset as *local* time. So `new Date(...)` on
 * that value is wrong by the machine's offset - two hours on the machine this was written on,
 * and zero on a UTC continuous-integration runner. A bug that appears only on some machines is
 * considerably worse than one that appears on all of them.
 *
 * Nothing is changed in the API to avoid this. The timestamps are ambiguous rather than wrong,
 * and reformatting them would alter a response every existing client already reads; the suite
 * handles the ambiguity on its own side instead.
 */
export function parseApiDate(value: string): Date {
  return new Date(hasOffset(value) ? value : `${value}Z`)
}

/** Milliseconds between two timestamps as the API writes them. */
export function millisecondsBetween(from: string, to: string): number {
  return parseApiDate(to).getTime() - parseApiDate(from).getTime()
}

/** Whole days between two timestamps as the API writes them, rounded to the nearest day. */
export function daysBetween(from: string, to: string): number {
  return Math.round(millisecondsBetween(from, to) / (24 * 60 * 60 * 1000))
}

const OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i

const hasOffset = (value: string): boolean => OFFSET.test(value)

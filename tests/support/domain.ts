// The business rules the API implements, restated.
//
// These duplicate constants in src/LibrarySystem.Api/Services/LoanService.cs, and the duplication
// is deliberate. A test that imported the value it was checking would agree with the code no
// matter what the code said; restating the requirement independently is what makes a change to
// the rule show up as a failed test rather than as a quietly updated expectation.

/** A loan is due back this many days after it is borrowed. */
export const LOAN_PERIOD_DAYS = 14

/** A member may hold this many loans at once, and is refused the next one. */
export const MAX_ACTIVE_LOANS_PER_MEMBER = 5

export const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export const daysFromNow = (days: number): Date => daysAgo(-days)

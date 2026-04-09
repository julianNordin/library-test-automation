// Values no other test will produce, so specs can run in parallel against a shared database.
//
// This is the whole isolation strategy. The suite does not reset the database between tests and
// it does not tidy up after itself, because it cannot: the API refuses to delete a book or a
// member with any loan history, which is exactly the data the interesting tests create. Cleanup
// by deletion is therefore impossible for the entities that matter, and cleanup by truncation
// would force the suite to run one test at a time.
//
// Uniqueness instead. Every spec creates its own data, asserts only on that data, and leaves it
// behind. Two consequences follow, and both are deliberate:
//
//   - nothing may assert on a count or a list length, because the contents of the database are
//     whatever previous runs left there;
//   - the database grows. It is a disposable container; `npm run db:down` is the reset.

// Three things have to combine for a value to be unique.
//
// The run: the low digits of the clock at the moment this module is first imported. Nine digits
// cycle roughly every eleven days, which only matters if two runs land on the same millisecond
// of the same phase of that cycle - and then only if the two below also match.
const runDigits = String(Date.now()).slice(-9)

// The worker: Playwright gives each worker process its own index, and unlike the parallel-slot
// index it is never reused when a worker is restarted after a failure.
const workerIndex = Number(process.env.TEST_WORKER_INDEX ?? 0)

// The call: a counter, which is per-process and therefore per-worker.
let callCount = 0

const pad = (value: number, width: number) => String(value).padStart(width, '0')

function nextSuffix(): string {
  callCount += 1
  return `${pad(workerIndex, 3)}${pad(callCount, 4)}${runDigits}`
}

/**
 * An ISBN no other test will use. Digits only and prefixed 978 so it reads like a real one in the
 * client's markup, and 19 characters so it fits the column's limit of 20.
 */
export function uniqueIsbn(): string {
  return `978${nextSuffix()}`
}

/**
 * An address in the reserved `.test` domain, which by definition resolves nowhere.
 */
export function uniqueEmail(local = 'member'): string {
  return `${local}-${nextSuffix()}@library.test`
}

/**
 * A title unique enough to locate by. UI specs find a book by its title, so a shared one would
 * make a locator ambiguous the moment two specs ran at once.
 */
export function uniqueTitle(prefix = 'Test Book'): string {
  return `${prefix} ${nextSuffix()}`
}

/**
 * A member name unique enough to locate by, for the same reason.
 */
export function uniqueName(prefix = 'Test Member'): string {
  return `${prefix} ${nextSuffix()}`
}

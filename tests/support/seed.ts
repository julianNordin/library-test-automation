// What the API puts into an empty database on its first start, from
// src/LibrarySystem.Api/Data/DbInitializer.cs. Stated once, so a change to the seed breaks in
// one place rather than in every spec that happened to know about it.
//
// Tests assert these titles are *present*. Nothing in this suite asserts how many books exist:
// specs create their own data as they run and, because the API refuses to delete anything with
// loan history, they cannot tidy it away afterwards. Any count is therefore a moving target,
// and a test that depends on one is a test that only passes on a database nobody has used yet.
export const SEEDED_BOOK_TITLES = [
  'Clean Code',
  'The Pragmatic Programmer',
  'Design Patterns',
  'Domain-Driven Design',
  'Refactoring',
] as const

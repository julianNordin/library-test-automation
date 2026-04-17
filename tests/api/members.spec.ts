import { expect, test } from '../fixtures/test'
import { aBook, aMember } from '../support/builders'
import { expectProblem, expectValidationProblem } from '../support/problem'
import { uniqueEmail } from '../support/unique'
import { parseApiDate } from '../support/dates'
import type { Member } from '../support/types'

test.describe('members over HTTP', () => {
  test('registers a member and stamps them with a joining date', async ({ api }) => {
    const built = aMember().build()

    const response = await api.raw.post('/api/members', { data: built })

    expect(response.status()).toBe(201)

    const created = (await response.json()) as Member
    expect(created).toMatchObject(built)

    // The client never sends this - the API sets it - so it is the API's claim to check.
    expect(parseApiDate(created.joinedDate).getTime()).toBeLessThanOrEqual(Date.now())

    const fetched = await api.getMember(created.id)
    expect(fetched).toMatchObject({ id: created.id, ...built })
    expect(parseApiDate(fetched.joinedDate).getTime()).toBe(
      parseApiDate(created.joinedDate).getTime(),
    )
  })

  test('serialises a timestamp two ways, depending on how you asked for it', async ({ api }) => {

    const created = (await (
      await api.raw.post('/api/members', { data: aMember().build() })
    ).json()) as Member
    const fetched = await api.getMember(created.id)

    // This characterises the API as it is; it does not endorse it. The value POST hands back is
    // the entity still in memory, whose DateTime has a UTC Kind, so it is written with a Z. The
    // value GET hands back has been round-tripped through a datetime2 column, which has no
    // concept of a Kind, so the same instant is written without one.
    //
    // The instants agree. The strings do not, and a client that compares them as strings - or
    // parses the second one with `new Date` - is wrong by its own offset.
    //
    // Worth noticing where this could be found: only here. The API's own integration tests use
    // the in-memory provider, which hands back the CLR object with its Kind intact, so both
    // responses look identical and the inconsistency cannot appear.
    expect(created.joinedDate).toMatch(/Z$/)
    expect(fetched.joinedDate).not.toMatch(/Z$/)
    expect(parseApiDate(fetched.joinedDate).getTime()).toBe(
      parseApiDate(created.joinedDate).getTime(),
    )
  })

  test('lists a member once they exist', async ({ api }) => {
    const created = await api.createMember(aMember().build())

    expect((await api.listMembers()).map((m) => m.email)).toContain(created.email)
  })

  test('updates a member in place', async ({ api }) => {
    const created = await api.createMember(aMember().build())

    const revised = { ...aMember().build(), email: created.email }
    await api.updateMember(created.id, revised)

    expect(await api.getMember(created.id)).toMatchObject(revised)
  })

  test('deletes a member who never borrowed anything', async ({ api }) => {
    const created = await api.createMember(aMember().build())

    await api.deleteMember(created.id)

    expect((await api.raw.get(`/api/members/${created.id}`)).status()).toBe(404)
  })

  test('refuses a duplicate email address', async ({ api }) => {
    const email = uniqueEmail()
    await api.createMember(aMember().withEmail(email).build())

    const response = await api.raw.post('/api/members', {
      data: aMember().withEmail(email).build(),
    })

    const problem = await expectProblem(response, 409, 'Duplicate value')
    expect(problem.detail).toContain(email)
  })

  test('refuses an address that is not an email address', async ({ api }) => {

    const response = await api.raw.post('/api/members', {
      data: aMember().withEmail('definitely-not-an-email').build(),
    })

    const problem = await expectValidationProblem(response)
    expect(Object.keys(problem.errors)).toEqual(['Email'])
    expect(problem.errors['Email']?.join(' ')).toContain('not a valid email address')
  })

  test('refuses a member with no name', async ({ api }) => {

    const response = await api.raw.post('/api/members', {
      data: aMember().withFullName('').build(),
    })

    const problem = await expectValidationProblem(response)
    expect(Object.keys(problem.errors)).toEqual(['FullName'])
  })

  test('refuses to delete a member with loan history', async ({ api }) => {
    const book = await api.createBook(aBook().build())
    const member = await api.createMember(aMember().build())
    const loan = await api.borrow(book.id, member.id)
    await api.returnLoan(loan.id)

    const problem = await expectProblem(
      await api.raw.delete(`/api/members/${member.id}`),
      409,
      'Delete conflict',
    )
    expect(problem.detail).toContain('loan history')

    expect((await api.getMember(member.id)).id).toBe(member.id)
  })

  test('answers 404 for an id that does not exist', async ({ api }) => {
    const missing = 2_000_000_000

    expect((await api.raw.get(`/api/members/${missing}`)).status()).toBe(404)
    expect((await api.raw.delete(`/api/members/${missing}`)).status()).toBe(404)
    expect(
      (await api.raw.put(`/api/members/${missing}`, { data: aMember().build() })).status(),
    ).toBe(404)
  })
})

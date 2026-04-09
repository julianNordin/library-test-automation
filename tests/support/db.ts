import sql from 'mssql'
import type { LoanRow } from './types'

/**
 * The one place this suite talks to SQL Server directly, and the reasoning for why it exists.
 *
 * Everything else goes through the API, on the principle that a test which sets up its world
 * through a back door is testing a world the application cannot actually reach. There is exactly
 * one state that principle cannot produce.
 *
 * `POST /api/loans/borrow` stamps `BorrowedDate = UtcNow` and `DueDate = UtcNow + 14 days`, and
 * nothing in the API can change either afterwards - there is no update endpoint for a loan. An
 * overdue loan is therefore unreachable through the API, and the alternative is waiting fourteen
 * days. So the row is written directly.
 *
 * The door is kept exactly that wide. One method, one table, no deletes and no reset: the suite
 * isolates by unique data rather than by cleaning up, so a `TRUNCATE` here would not be a
 * convenience, it would be a different strategy smuggled in through the back. Statements are
 * parameterised like any other production query - the values are the suite's own, but a habit
 * that only holds when the input is trusted is not a habit.
 */
export class TestDatabase {
  private pool: sql.ConnectionPool | null = null

  /**
   * Inserts a loan and returns its id.
   *
   * Build the row with `aLoan()`, which computes its dates relative to now - a literal date here
   * would be true on the day it was written and wrong every day after.
   */
  async insertLoan(row: LoanRow): Promise<number> {
    const pool = await this.connect()

    const result = await pool
      .request()
      .input('bookId', sql.Int, row.bookId)
      .input('memberId', sql.Int, row.memberId)
      .input('borrowedDate', sql.DateTime2, row.borrowedDate)
      .input('dueDate', sql.DateTime2, row.dueDate)
      .input('returnedDate', sql.DateTime2, row.returnedDate)
      .query<{ Id: number }>(
        `INSERT INTO Loans (BookId, MemberId, BorrowedDate, DueDate, ReturnedDate)
         OUTPUT INSERTED.Id
         VALUES (@bookId, @memberId, @borrowedDate, @dueDate, @returnedDate)`,
      )

    const id = result.recordset[0]?.Id
    if (id === undefined) {
      throw new Error('Inserting a loan returned no id, which should not be possible.')
    }

    return id
  }

  async close(): Promise<void> {
    await this.pool?.close()
    this.pool = null
  }

  private async connect(): Promise<sql.ConnectionPool> {
    if (this.pool) {
      return this.pool
    }

    // The same variable the API is given, so the tests and the system under test cannot end up
    // pointed at two different databases - the failure that would make every result meaningless
    // while looking entirely normal.
    const connectionString = process.env.ConnectionStrings__DefaultConnection
    if (!connectionString) {
      throw new Error(
        'ConnectionStrings__DefaultConnection is not set. Copy .env.example to .env, or export ' +
          'the variable yourself.',
      )
    }

    // node-mssql reads the .NET connection-string format directly, and writes a JS Date as UTC -
    // which matters, because the API stores and compares UTC, and a driver sending the machine's
    // local time would shift every loan inserted here by its offset.
    //
    // That default is checked rather than assumed, and it is deliberately not pinned here: the
    // round-trip assertion in tests/api/test-data.spec.ts fails loudly if it ever changes, which
    // is worth more than a configuration line that would quietly make the check moot.
    this.pool = await new sql.ConnectionPool(connectionString).connect()
    return this.pool
  }
}

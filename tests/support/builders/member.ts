import { uniqueEmail, uniqueName } from '../unique'
import type { NewMember } from '../types'

/**
 * A member the API will accept, with a unique name and email address. The API sets JoinedDate
 * itself, so there is nothing here to set it with.
 */
class MemberBuilder {
  private readonly member: NewMember = {
    fullName: uniqueName(),
    email: uniqueEmail(),
  }

  withFullName(fullName: string): this {
    this.member.fullName = fullName
    return this
  }

  withEmail(email: string): this {
    this.member.email = email
    return this
  }

  build(): NewMember {
    return { ...this.member }
  }
}

export const aMember = (): MemberBuilder => new MemberBuilder()

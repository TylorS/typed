import { Env } from '@fp/Env'
import { Resume } from '@fp/Resume'

export type GetStr = {
  readonly getStr: Resume<string>
}

/**
 * Read textual input from the User
 */
export const getStr: Env<GetStr, string> = (e) => e.getStr

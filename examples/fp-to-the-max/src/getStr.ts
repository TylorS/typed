import { Env } from '@fp/Env'
import { Resume } from '@fp/Resume'

export type GetStr = {
  getStr: Resume<string>
}

// Get input from the user
export const getStr: Env<GetStr, string> = (e) => e.getStr

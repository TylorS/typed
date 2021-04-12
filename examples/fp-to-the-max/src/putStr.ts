import { Env } from '@fp/Env'
import { Resume } from '@fp/Resume'

export type PutStr = {
  readonly putStr: (msg: string) => Resume<void>
}

/**
 * Write a message to the user
 */
export const putStr = (msg: string): Env<PutStr, void> => (e) => e.putStr(msg)

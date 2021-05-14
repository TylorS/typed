import { Env } from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import { EOL } from 'os'

import { GetStr, getStr } from './getStr'
import { PutStr, putStr } from './putStr'

/**
 * Ask the User a question
 */
export const askQuestion = (question: string): Env<GetStr & PutStr, string> =>
  Do(function* (_) {
    yield* _(putStr(EOL + question))

    return yield* _(getStr)
  })

import { Do } from '@fp/Fx/Env'
import { EOL } from 'os'

import { getStr } from './getStr'
import { putStr } from './putStr'

/**
 * Ask the User a question
 */
export const askQuestion = (question: string) =>
  Do(function* (_) {
    yield* _(putStr(EOL + question))

    return yield* _(getStr)
  })

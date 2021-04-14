import { Env } from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef, Ref, Refs } from '@fp/Ref'
import { askQuestion } from 'askQuestion'
import { isNone } from 'fp-ts/Option'

import { GetStr } from './getStr'
import { parseInteger } from './parseInteger'
import { PutStr } from './putStr'

/**
 * Ask for the Min integer value to use when generating random integers
 */
export const askForMin: Env<PutStr & GetStr, number> = Do(function* (_) {
  const answer = yield* _(askQuestion(`Choose the minimum integer for game:`))
  const option = parseInteger(answer)

  if (isNone(option)) {
    // 100% stack-safe recursion
    return yield* _(askForMin)
  }

  return option.value
})

/**
 * Reference to the Minimum number value
 */
export const Min: Ref<PutStr & GetStr, number> = createRef(askForMin)

/**
 * Get the current minimum
 */
export const getMin: Env<PutStr & GetStr & Refs, number> = getRef(Min)

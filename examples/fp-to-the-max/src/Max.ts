import { Env } from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef, Ref, Refs } from '@fp/Ref'
import { askQuestion } from 'askQuestion'
import { isNone } from 'fp-ts/Option'

import { GetStr } from './getStr'
import { parseInteger } from './parseInteger'
import { PutStr } from './putStr'

/**
 * Ask for Max integer value to use for the game
 */
export const askForMax: Env<PutStr & GetStr, number> = Do(function* (_) {
  const answer = yield* _(askQuestion(`Choose the maximum integer for game:`))
  const option = parseInteger(answer)

  if (isNone(option)) {
    // 100% stack-safe recursion
    return yield* _(askForMax)
  }

  return option.value
})

/**
 * The Max integer to use when generating a random integer
 */
export const Max: Ref<PutStr & GetStr, number> = createRef(askForMax)

/**
 * Get the Max configured value
 */
export const getMax: Env<PutStr & GetStr & Refs, number> = getRef(Max)

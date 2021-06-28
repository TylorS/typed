import * as E from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Ref'

import { askQuestion } from './askQuestion'
import { putWinsAndLosses } from './formatWinsAndLosses'
import { GetStr } from './getStr'
import { Name } from './Name'
import { PutStr } from './putStr'

/**
 * Track if the game should continue or not
 */
export const ShouldContinue = R.create(E.of<boolean>(true))

const VALID_YES_ANSWERS = ['y', 'yes', 'sure']
const VALID_NO_ANSWERS = ['n', 'no', 'nope']

/**
 * Ask if the current user would like to continue playing the game
 */
export const askToContinue: E.Env<R.Refs & GetStr & PutStr, boolean> = Do(function* (_) {
  // Print the current score
  yield* _(putWinsAndLosses)

  // Ask if the user would like to continue
  const name = yield* _(Name.get)
  const answer = yield* _(askQuestion(`Do you want to continue, ${name}? (y/n)`))

  // Handle yes
  if (VALID_YES_ANSWERS.includes(answer.toLowerCase())) {
    return yield* _(ShouldContinue.set(true))
  }

  // Handle no
  if (VALID_NO_ANSWERS.includes(answer.toLowerCase())) {
    return yield* _(ShouldContinue.set(false))
  }

  // Try again w/ stack-safe recursion
  return yield* _(askToContinue)
})

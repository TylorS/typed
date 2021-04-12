import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Ref'
import { formatWinsAndLosses } from 'formatWinsAndLosses'

import { askQuestion } from './askQuestion'
import { GetStr } from './getStr'
import { getName } from './Name'
import { PutStr, putStr } from './putStr'

/**
 * Track if the game should continue or not
 */
export const ShouldContinue = R.createRef(E.of(true))

export const shouldContinue = R.getRef(ShouldContinue)

// Ask to continue the game
export const askToContinue: E.Env<R.Refs & GetStr & PutStr, boolean> = Do(function* (_) {
  const winsAndLosses = yield* _(formatWinsAndLosses)

  yield* _(putStr(winsAndLosses))

  const name = yield* _(getName)
  const answer = yield* _(askQuestion(`Do you want to continue, ${name}? (y/n)`))

  if (answer === 'y') {
    return yield* pipe(ShouldContinue, R.setRef(true), _)
  }

  if (answer === 'n') {
    return yield* pipe(ShouldContinue, R.setRef(false), _)
  }

  // 100% stack-safe recursion
  return yield* _(askToContinue)
})

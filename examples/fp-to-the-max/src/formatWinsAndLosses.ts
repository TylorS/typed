import { Env } from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import { Refs } from '@fp/Ref'
import { EOL } from 'os'

import { Losses } from './Losses'
import { putStr } from './putStr'
import { Wins } from './Wins'

/**
 * Formats the current state for wins and losses in a text format for the user
 */
export const formatWinsAndLosses: Env<Refs, string> = Do(function* (_) {
  const wins = yield* _(Wins.get)
  const losses = yield* _(Losses.get)
  const total = wins + losses

  return `${EOL}W ${wins} | L ${losses} | T ${total}`
})

export const putWinsAndLosses = Do(function* (_) {
  const winsAndLosses = yield* _(formatWinsAndLosses)

  yield* _(putStr(winsAndLosses))
})

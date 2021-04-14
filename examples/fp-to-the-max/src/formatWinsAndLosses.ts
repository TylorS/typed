import { Do } from '@fp/Fx/Env'
import { EOL } from 'os'

import { getLosses } from './Losses'
import { putStr } from './putStr'
import { getWins } from './Wins'

/**
 * Formats the current state for wins and losses in a text format for the user
 */
export const formatWinsAndLosses = Do(function* (_) {
  const wins = yield* _(getWins)
  const losses = yield* _(getLosses)
  const total = wins + losses

  return `${EOL}W ${wins} | L ${losses} | T ${total}`
})

export const putWinsAndLosses = Do(function* (_) {
  const winsAndLosses = yield* _(formatWinsAndLosses)

  yield* _(putStr(winsAndLosses))
})

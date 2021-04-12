import { Do } from '@fp/Fx/Env'
import { getLosses } from 'Losses'
import { EOL } from 'os'
import { getWins } from 'Wins'

// Format wins and losses
export const formatWinsAndLosses = Do(function* (_) {
  const wins = yield* _(getWins)
  const losses = yield* _(getLosses)
  const total = wins + losses

  return `${EOL}W ${wins} | L ${losses} | T ${total}`
})

import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Ref'
import * as O from 'fp-ts/Option'
import { EOL } from 'os'

import { askQuestion } from './askQuestion'
import { GetStr } from './getStr'
import { lost } from './Losses'
import { Max } from './Max'
import { Min } from './Min'
import { Name } from './Name'
import { parseInteger } from './parseInteger'
import { PutStr, putStr } from './putStr'
import { RandomInt, randomInt } from './random'
import { won } from './Wins'

/**
 * Generate a new random int between configured min and max
 */
export const generateNewSecret: E.Env<RandomInt & PutStr & GetStr & R.Refs, number> = Do(function* (
  _,
) {
  const min = yield* _(Min.get)
  const max = yield* _(Max.get)
  const secret = yield* _(randomInt(min, max))

  return secret
})

/**
 * A reference to keep the the secret number the current user is meant to guess
 */
export const Secret = R.create(generateNewSecret)

// Message to give user when guessing wrong
export const wrongGuess = Do(function* (_) {
  const secret = yield* _(Secret.get)
  const name = yield* _(Name.get)

  yield* _(putStr(`You guessed wrong, ${name}! The number was: ${secret}`))
})

// Message to give user when guess is not an integer
export const unknownGuess = putStr(`${EOL} You did not enter an integer!`)

// Message to give user when guessing correctly
export const correctGuess = Do(function* (_) {
  const name = yield* _(Name.get)

  yield* _(putStr(`${EOL}You guessed right, ${name}!`))
})

/**
 * Ask for the current secret, keeping track of wins and losses
 */
export const askForSecret = Do(function* (_) {
  // Get the current state
  const [secret, name, min, max] = yield* _(
    E.zipW([Secret.get, Name.get, Min.get, Max.get] as const),
  )

  // Ask the user to guess the secret number
  const option = parseInteger(
    yield* _(askQuestion(`Dear ${name}, please guess a number from ${min} to ${max}`)),
  )

  return yield* pipe(
    option,
    O.matchW(
      () => unknownGuess,
      (guess) =>
        Do(function* () {
          const correct = guess === secret

          // Update the score
          yield* _(correct ? won : lost)

          // Inform the user
          yield* _(correct ? correctGuess : wrongGuess)
        }),
    ),
    _,
  )
})

/**
 * Update the Secret value
 */
export const updateSecret = Do(function* (_) {
  const newSecret = yield* _(generateNewSecret)

  return yield* _(Secret.set(newSecret))
})

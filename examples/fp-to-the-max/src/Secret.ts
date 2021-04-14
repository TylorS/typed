import { Env } from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Ref'
import * as O from 'fp-ts/Option'
import { EOL } from 'os'

import { askQuestion } from './askQuestion'
import { GetStr } from './getStr'
import { lost } from './Losses'
import { getMax } from './Max'
import { getMin } from './Min'
import { getName } from './Name'
import { parseInteger } from './parseInteger'
import { PutStr, putStr } from './putStr'
import { RandomInt, randomInt } from './random'
import { won } from './Wins'

/**
 * Generate a new random int between configured min and max
 */
export const generateNewSecret: Env<RandomInt & PutStr & GetStr & R.Refs, number> = Do(function* (
  _,
) {
  const min = yield* _(getMin)
  const max = yield* _(getMax)
  const secret = yield* _(randomInt(min, max))

  return secret
})

/**
 * A reference to keep the the secret number the current user is meant to guess
 */
export const Secret: R.Ref<RandomInt & PutStr & GetStr & R.Refs, number> = R.createRef(
  generateNewSecret,
)

/**
 * Get the current Secret value
 */
export const getSecret: Env<RandomInt & PutStr & GetStr & R.Refs, number> = R.getRef(Secret)

/**
 * Update the secret's value
 */
export const setSecret: (
  value: number,
) => Env<RandomInt & PutStr & GetStr & R.Refs, number> = R.setRef(Secret)

// Message to give user when guessing wrong
export const wrongGuess: Env<RandomInt & PutStr & GetStr & R.Refs, void> = Do(function* (_) {
  const secret = yield* _(getSecret)
  const name = yield* _(getName)

  yield* _(putStr(`You guessed wrong, ${name}! The number was: ${secret}`))
})

// Message to give user when guess is not an integer
export const unknownGuess: Env<PutStr, void> = putStr(`${EOL} You did not enter an integer!`)

// Message to give user when guessing correctly
export const correctGuess: Env<GetStr & PutStr & R.Refs, void> = Do(function* (_) {
  const name = yield* _(getName)

  yield* _(putStr(`${EOL}You guessed right, ${name}!`))
})

// Welcome the current user to the game
export const welcomeToTheGame: Env<GetStr & PutStr & R.Refs, void> = Do(function* (_) {
  const name = yield* _(getName)

  yield* _(putStr(`${EOL}Hello, ${name} welcome to the game!`))
})

/**
 * Ask for the current secret, keeping track of wins and losses
 */
export const askForSecret: Env<RandomInt & PutStr & GetStr & R.Refs, void> = Do(function* (_) {
  // Get the current state
  const secret = yield* _(getSecret)
  const name = yield* _(getName)
  const min = yield* _(getMin)
  const max = yield* _(getMax)

  // Ask the user to guess the secret number
  const option = parseInteger(
    yield* _(askQuestion(`Dear ${name}, please guess a number from ${min} to ${max}`)),
  )

  // Unable to parse the input as an integer
  if (O.isNone(option)) {
    return yield* _(unknownGuess)
  }

  // Determine if you won or lost
  const correct = option.value == secret

  // Update the score
  yield* _(correct ? won : lost)

  // Inform the user
  yield* _(correct ? correctGuess : wrongGuess)
})

/**
 * Update the Secret value
 */
export const updateSecret: Env<RandomInt & PutStr & GetStr & R.Refs, number> = Do(function* (_) {
  const newSecret = yield* _(generateNewSecret)

  return yield* _(setSecret(newSecret))
})

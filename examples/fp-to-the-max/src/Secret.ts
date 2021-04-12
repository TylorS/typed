import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Ref'
import { askQuestion } from 'askQuestion'
import * as O from 'fp-ts/Option'
import { EOL } from 'os'

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
export const generateNewSecret = Do(function* (_) {
  const min = yield* _(getMin)
  const max = yield* _(getMax)
  const secret = yield* _(randomInt(min, max))

  return secret
})

// Reference to the current secret number to be guessed
export const Secret: R.Ref<RandomInt & PutStr & GetStr & R.Refs, number> = R.createRef(
  generateNewSecret,
)

export const getSecret = R.getRef(Secret)
export const setSecret = R.setRef_(Secret)

// Message to give user when guessing wrong
export const wrongGuess = Do(function* (_) {
  const secret = yield* _(getSecret)
  const name = yield* _(getName)

  yield* _(putStr(`You guessed wrong, ${name}! The number was: ${secret}`))
})

// Message to give user when guess is not an integer
export const unknownGuess = putStr(`${EOL} You did not enter an integer!`)

// Message to give user when guessing correctly
export const correctGuess = Do(function* (_) {
  const name = yield* _(getName)

  yield* _(putStr(`${EOL}You guessed right, ${name}!`))
})

// Welcome the current user to the game
export const welcomeToTheGame = Do(function* (_) {
  const name = yield* _(getName)

  yield* _(putStr(`${EOL}Hello, ${name} welcome to the game!`))
})

/**
 * Ask for the current secret, keeping track of wins and losses
 */
export const askForSecret = Do(function* (_) {
  const secret = yield* _(getSecret)
  const name = yield* _(getName)
  const min = yield* _(getMin)
  const max = yield* _(getMax)

  const option = parseInteger(
    yield* _(askQuestion(`Dear ${name}, please guess a number from ${min} to ${max}`)),
  )

  if (O.isNone(option)) {
    return yield* _(unknownGuess)
  }

  if (option.value == secret) {
    yield* _(won)

    return yield* _(correctGuess)
  }

  yield* _(lost)
  yield* _(wrongGuess)
})

/**
 * Update the Secret value
 */
export const updateSecret = Do(function* (_) {
  const newSecret = yield* _(generateNewSecret)

  return yield* _(setSecret(newSecret))
})

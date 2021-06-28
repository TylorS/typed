import { Do } from '@fp/Fx/Env'

import { askForSecret, updateSecret } from './Secret'
import { askToContinue, ShouldContinue } from './ShouldContinue'
import { welcomeToTheGame } from './welcomeToTheGame'

/**
 * The lazy description of our game.
 */
export const game = Do(function* (_) {
  // Ask for the name of player and welcome them
  yield* _(welcomeToTheGame)

  // Continue as long as the user would like to play
  while (yield* _(ShouldContinue.get)) {
    // Randomize the secret to guess
    yield* _(updateSecret)
    // Ask player for their guess of the secret
    yield* _(askForSecret)
    // Ask player if they sould like to continue playing
    yield* _(askToContinue)
  }
})

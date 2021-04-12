import { Do } from '@fp/Fx/Env'

import { askForSecret, updateSecret, welcomeToTheGame } from './Secret'
import { askToContinue, shouldContinue } from './ShouldContinue'

// A description of the game
export const game = Do(function* (_) {
  // Ask for the name of player and welcome them
  yield* _(welcomeToTheGame)

  // Continue as long as the user would like to play
  while (yield* _(shouldContinue)) {
    // Ensure we change the secret
    yield* _(updateSecret)
    // Ask player for the secret value
    yield* _(askForSecret)
    // Ask player if they sould like to continue playing
    yield* _(askToContinue)
  }
})

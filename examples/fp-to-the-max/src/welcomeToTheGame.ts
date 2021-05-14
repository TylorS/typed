import { Env } from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import { Refs } from '@fp/Ref'
import { EOL } from 'os'

import { GetStr } from './getStr'
import { Name } from './Name'
import { PutStr, putStr } from './putStr'

// Welcome the current user to the game
export const welcomeToTheGame: Env<GetStr & PutStr & Refs, void> = Do(function* (_) {
  const name = yield* _(Name.get)

  yield* _(putStr(`${EOL}Hello, ${name} welcome to the game!`))
})

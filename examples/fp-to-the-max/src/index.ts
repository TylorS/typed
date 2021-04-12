import { createReferences, Refs } from '@fp/Ref'
import { fromIO, fromTask, toTask } from '@fp/Resume'
import { log } from 'fp-ts/Console'
import { flow, pipe } from 'fp-ts/function'
import { randomInt } from 'fp-ts/Random'
import { createInterface } from 'readline'

import { game } from './game'
import { GetStr } from './getStr'
import { PutStr } from './putStr'
import { RandomInt } from './random'

// Create the resources requried for the application

const PutStr: PutStr = {
  putStr: flow(log, fromIO),
}

const GetStr: GetStr = {
  getStr: fromTask(
    () =>
      new Promise((resolve) => {
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
        })
        rl.question('> ', (answer) => {
          rl.close()
          resolve(answer)
        })
      }),
  ),
}

const RandomInt: RandomInt = {
  randomInt: (min, max) => fromIO(randomInt(min, max)),
}

const Refs: Refs = {
  refs: createReferences(),
}

// Provide resource and convert to a Task
const main = pipe(
  {
    ...Refs,
    ...PutStr,
    ...GetStr,
    ...RandomInt,
  },
  game,
  toTask,
)

// Run
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

import { settable } from '@fp/Disposable'
import * as Ref from '@fp/Ref'
import { async, fromIO, toTask } from '@fp/Resume'
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
  getStr: async((resume) => {
    // Disposable that can be appended
    // Useful for wrapping callback/promise-based resources in Disposable
    const d = settable()

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question('> ', (answer) => {
      rl.close()
      resume(answer)
    })

    // Allow canceling this workflow
    d.addDisposable({ dispose: () => rl.close() })

    return d
  }),
}

const RandomInt: RandomInt = {
  randomInt: flow(randomInt, fromIO),
}

// Provide resource and convert to a Task
const main = pipe(
  {
    ...Ref.refs(),
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

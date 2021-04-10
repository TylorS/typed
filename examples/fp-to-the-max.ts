import { log } from 'fp-ts/Console'
import { flow, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { randomInt } from 'fp-ts/Random'
import { Task } from 'fp-ts/Task'
import { createInterface } from 'readline'

import * as E from '../src/Env'
import { Do } from '../src/Fx/Env'
import * as R from '../src/Resume'

type GetStr = {
  getStr: R.Resume<string>
}
const getStr = pipe(
  E.ask<GetStr>(),
  E.chainResumeK((e) => e.getStr),
)

type PutStr = {
  putStr: (msg: string) => R.Resume<void>
}

const putStr = (msg: string) =>
  pipe(
    E.ask<PutStr>(),
    E.chainResumeK((e) => e.putStr(msg)),
  )

const askQuestion = (question: string) =>
  Do(function* (_) {
    yield* _(putStr(question))

    return yield* _(getStr)
  })

const random = E.fromIO(randomInt(1, 5))

function parseInteger(s: string): O.Option<number> {
  const i = +s

  return isNaN(i) || i % 1 !== 0 ? O.none : O.some(i)
}

const askToContinue = (name: string): E.Env<GetStr & PutStr, boolean> =>
  Do(function* (_) {
    const answer = yield* _(askQuestion(`Do you want to continue, ${name}? (y/n)`))

    switch (answer.toLowerCase().trim()) {
      case 'y':
        return true
      case 'n':
        return false
      default:
        return yield* _(askToContinue(name))
    }
  })

const unknownGuess = putStr(`You did not enter an integer!`)
const correctGuess = (name: string) => putStr(`You guessed right, ${name}!`)
const wrongGuess = (name: string, secret: number) =>
  putStr(`You guessed wrong, ${name}! The number was: ${secret}`)

const game = (name: string) =>
  Do(function* (_) {
    const secret = yield* _(random)
    const option = parseInteger(
      yield* _(askQuestion(`Dear ${name}, please guess a number from 1 to 5`)),
    )

    if (O.isNone(option)) {
      return yield* _(unknownGuess)
    }

    yield* _(option.value === secret ? correctGuess(name) : wrongGuess(name, secret))
  })

const main = Do(function* (_) {
  const name = yield* _(askQuestion(`What's your name?`))

  yield* _(putStr(`Hello, ${name} welcome to the game!`))

  let shouldContinue = true
  while (shouldContinue) {
    yield* _(game(name))

    shouldContinue = yield* _(askToContinue(name))
  }
})

const getStrLn: Task<string> = () =>
  new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question('> ', (answer) => {
      rl.close()
      resolve(answer)
    })
  })

// Run
pipe({ putStr: flow(log, R.fromIO), getStr: R.fromTask(getStrLn) }, main, R.exec)

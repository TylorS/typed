import * as E from '@fp/Env'
import { flow, pipe } from '@fp/function'
import * as KV from '@fp/KV'
import * as O from '@fp/Option'
import * as Ref from '@fp/Ref'
import { log } from 'fp-ts/Console'
import { left, right } from 'fp-ts/Either'
import { randomInt } from 'fp-ts/Random'
import { createInterface } from 'readline'

const VALID_YES_ANSWERS = ['y', 'yes', 'sure']
const VALID_NO_ANSWERS = ['n', 'no', 'nope']
const MIN = 1
const MAX = 5

const askQuestion = E.op<(question: string) => E.Of<string>>()('askQuestion')
const putStr = E.op<(msg: string) => E.Of<void>>()('putStr')
const random = E.op<() => E.Of<number>>()('random')()

const Name = Ref.kv(askQuestion(`What's your name?`))
const ShouldContinue = Ref.kv(E.of<boolean>(true))

const Secret = Ref.kv(random)

const welcomeToTheGame = pipe(
  Name.get,
  E.chainW((name) => putStr(`Hello, ${name} welcome to the game!`)),
)

function parseInteger(s: string): O.Option<number> {
  const i = parseInt(s, 10)

  return Number.isNaN(i) ? O.none : O.some(i)
}

const unknownGuess = putStr(`You did not enter an integer!`)

const wrongGuess = pipe(
  E.Do,
  E.bindW('secret', () => Secret.get),
  E.bindW('name', () => Name.get),
  E.chainW(({ secret, name }) => putStr(`You guessed wrong, ${name}! The number was: ${secret}`)),
)

const correctGuess = pipe(
  Name.get,
  E.chainW((name) => putStr(`You guessed right, ${name}!`)),
)

const askToContinue = pipe(
  Name.get,
  E.chainW((name) => askQuestion(`Do you want to continue, ${name}? (y/n)`)),
)

const askToContinueUntilAnswered = pipe(
  askToContinue,
  E.chainW(
    E.chainRec((answer: string) => {
      if (VALID_YES_ANSWERS.includes(answer.toLowerCase())) {
        return pipe(ShouldContinue.set(true), E.map(right))
      }

      if (VALID_NO_ANSWERS.includes(answer.toLowerCase())) {
        return pipe(ShouldContinue.set(false), E.map(right))
      }

      return pipe(askToContinue, E.map(left))
    }),
  ),
)

const round = pipe(
  E.Do,
  E.bindW('name', () => Name.get),
  E.bindW('secret', () => Secret.get),
  E.bindW('answer', ({ name }) =>
    pipe(
      askQuestion(`Dear ${name}, please guess a number from ${MIN} to ${MAX}`),
      E.map(parseInteger),
    ),
  ),
  E.chainW(({ answer, secret }) =>
    pipe(
      answer,
      O.matchW(
        () => unknownGuess,
        (a) => (secret === a ? correctGuess : wrongGuess),
      ),
    ),
  ),
  E.chainW(() => Secret.remove),
)

const game = pipe(
  welcomeToTheGame,
  E.chainW(() => ShouldContinue.get),
  E.chainW(
    E.chainRec((shouldContinue: boolean) =>
      shouldContinue
        ? pipe(
            round,
            E.chainW(() => askToContinueUntilAnswered),
            E.map(left),
          )
        : E.of(right(null)),
    ),
  ),
)

pipe(
  game,
  E.execWith({
    ...KV.env(),
    putStr: flow(log, E.fromIO),
    random: () => pipe(randomInt(MIN, MAX), E.fromIO),
    askQuestion: flow(
      log,
      E.fromIO,
      E.chainW(() =>
        E.fromTask(
          () =>
            new Promise<string>((resolve) => {
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
      ),
    ),
  }),
)

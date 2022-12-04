import * as Either from '@fp-ts/data/Either'
import * as RA from '@fp-ts/data/ReadonlyArray'
import * as Exit from '@typed/exit'

import * as I from '../Effect/Instruction.js'
import * as FiberId from '../FiberId/FiberId.js'
import { Future, pending } from '../Future/Future.js'

import { RuntimeFiber, Synthetic, SyntheticFiber } from './Fiber.js'

export function zip<E2, B>(second: RuntimeFiber<E2, B>) {
  return <E1, A>(first: RuntimeFiber<E1, A>): SyntheticFiber<E1 | E2, readonly [A, B]> => {
    return Synthetic({
      id: FiberId.Synthetic([first.id, second.id]),
      exit: new I.Lazy(() => new I.Async(zipFuture(first, second))),
      inheritRefs: new I.FlatMap([first.inheritRefs, () => second.inheritRefs]),
      interruptAs: (id) =>
        I.gen(function* () {
          const f = yield* new I.Fork([new I.FlatMap([first.interruptAs(id), I.fromExit])])
          const s = yield* new I.Fork([new I.FlatMap([second.interruptAs(id), I.fromExit])])

          return yield* new I.Async(zipFuture(f, s))
        }),
    })
  }
}

export function race<E2, B>(second: RuntimeFiber<E2, B>) {
  return <E1, A>(first: RuntimeFiber<E1, A>): SyntheticFiber<E1 | E2, A | B> => {
    return Synthetic({
      id: FiberId.Synthetic([first.id, second.id]),
      exit: new I.Lazy(() => new I.Async(raceFuture(first, second, true))),
      inheritRefs: new I.FlatMap([first.inheritRefs, () => second.inheritRefs]),
      interruptAs: (id) =>
        I.gen(function* () {
          const f = yield* new I.Fork([new I.FlatMap([first.interruptAs(id), I.fromExit])])
          const s = yield* new I.Fork([new I.FlatMap([second.interruptAs(id), I.fromExit])])

          return yield* new I.Async(raceFuture(f, s, false))
        }),
    })
  }
}

const combineConcurrent = Exit.makeConcurrentSemigroup<any, readonly any[]>(RA.getSemigroup<any>())

function zipFuture<E, A, E2, B>(
  first: RuntimeFiber<E, A>,
  second: RuntimeFiber<E2, B>,
): Future<never, never, Exit.Exit<E | E2, readonly [A, B]>> {
  const future = pending.of<Exit.Exit<E | E2, readonly any[]>>()

  let firstExit: Exit.Exit<E, readonly [A]> | null = null
  let secondExit: Exit.Exit<E2, readonly [B]> | null = null

  const firstDisposable = first.addObserver((exit) => onExit(exit, 0))
  const secondDisposable = second.addObserver((exit) => onExit(exit, 1))

  return future as Future<never, never, Exit.Exit<E | E2, readonly [A, B]>>

  function onExit(exit: Exit.Exit<E | E2, A | B>, index: 0 | 1) {
    if (index === 0) {
      firstExit = Either.tupled(exit) as Exit.Exit<E, readonly [A]>
    } else {
      secondExit = Either.tupled(exit) as Exit.Exit<E2, readonly [B]>
    }

    if (Either.isLeft(exit)) {
      future.complete(
        new I.Map([
          new I.Lazy<never, never, Exit.Exit<E | E2, A | B>>(() =>
            index === 0
              ? (secondDisposable.dispose(), second.interruptAs(first.id))
              : (firstDisposable.dispose(), first.interruptAs(second.id)),
          ),
          (exit2: Exit.Exit<E | E2, A | B>) =>
            index === 0
              ? combineConcurrent.combine(Either.tupled(exit2))(exit)
              : combineConcurrent.combine(exit)(Either.tupled(exit2)),
        ]),
      )
    } else if (firstExit && secondExit) {
      future.complete(new I.Of(combineConcurrent.combine(secondExit)(firstExit)))
    }
  }
}

function raceFuture<E, A, E2, B>(
  first: RuntimeFiber<E, A>,
  second: RuntimeFiber<E2, B>,
  shouldInterrupt: boolean,
): Future<never, never, Exit.Exit<E | E2, A | B>> {
  const future = pending.of<Exit.Exit<E | E2, A | B>>()

  const firstDisposable = first.addObserver((exit) => onExit(exit, 0))
  const secondDisposable = second.addObserver((exit) => onExit(exit, 1))

  return future

  function onExit(exit: Exit.Exit<E | E2, A | B>, index: 0 | 1) {
    firstDisposable.dispose()
    secondDisposable.dispose()

    if (shouldInterrupt) {
      future.complete(
        new I.Map<never, never, Exit.Exit<E | E2, A | B>, Exit.Exit<E | E2, A | B>>([
          index === 0 ? second.interruptAs(first.id) : first.interruptAs(second.id),
          () => exit,
        ]),
      )
    } else {
      future.complete(new I.Of(exit))
    }
  }
}

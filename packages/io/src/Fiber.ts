import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import * as RA from '@fp-ts/data/ReadonlyArray'
import { Disposable } from '@typed/disposable'
import * as Exit from '@typed/exit'

import * as Effect from './Effect/Effect.js'
import * as FiberId from './FiberId.js'
import { Future, pending } from './Future.js'

export type Fiber<E, A> = RuntimeFiber<E, A> | SyntheticFiber<E, A>

// TODO: Tracing
export interface RuntimeFiber<Errors, Output> extends Omit<SyntheticFiber<Errors, Output>, 'tag'> {
  readonly tag: 'Runtime'
  readonly addObserver: (observer: (exit: Exit.Exit<Errors, Output>) => void) => Disposable
}

export function Runtime<E, A>(options: Omit<RuntimeFiber<E, A>, 'tag'>): RuntimeFiber<E, A> {
  return { tag: 'Runtime', ...options }
}

export interface SyntheticFiber<Errors, Output> {
  readonly tag: 'Synthetic'
  readonly id: FiberId.FiberId
  readonly exit: Effect.Effect<never, never, Exit.Exit<Errors, Output>>
  readonly inheritRefs: Effect.Effect<never, never, void>
  readonly interruptAs: (
    id: FiberId.FiberId,
  ) => Effect.Effect<never, never, Exit.Exit<Errors, Output>>
}

export function Synthetic<E, A>(options: Omit<SyntheticFiber<E, A>, 'tag'>): SyntheticFiber<E, A> {
  return { tag: 'Synthetic', ...options }
}

export function match<E, A, B, C>(
  onSynthetic: (fiber: SyntheticFiber<E, A>) => B,
  onRuntime: (fiber: RuntimeFiber<E, A>) => C,
) {
  return (fiber: Fiber<E, A>): B | C =>
    fiber.tag === 'Synthetic' ? onSynthetic(fiber) : onRuntime(fiber)
}

export function zip<E2, B>(second: RuntimeFiber<E2, B>) {
  return <E1, A>(first: RuntimeFiber<E1, A>): SyntheticFiber<E1 | E2, readonly [A, B]> => {
    return Synthetic({
      id: FiberId.Synthetic([first.id, second.id]),
      exit: Effect.lazy(() => Effect.wait(zipFuture(first, second))),
      inheritRefs: pipe(
        first.inheritRefs,
        Effect.flatMap(() => second.inheritRefs),
      ),
      interruptAs: (id) =>
        Effect.Effect(function* () {
          return yield* Effect.wait(
            zipFuture(
              yield* pipe(first.interruptAs(id), Effect.flatMap(Effect.fromExit), Effect.fork),
              yield* pipe(second.interruptAs(id), Effect.flatMap(Effect.fromExit), Effect.fork),
            ),
          )
        }),
    })
  }
}

export function race<E2, B>(second: RuntimeFiber<E2, B>) {
  return <E1, A>(first: RuntimeFiber<E1, A>): SyntheticFiber<E1 | E2, A | B> => {
    return Synthetic({
      id: FiberId.Synthetic([first.id, second.id]),
      exit: Effect.lazy(() => Effect.wait(raceFuture(first, second, true))),
      inheritRefs: pipe(
        first.inheritRefs,
        Effect.flatMap(() => second.inheritRefs),
      ),
      interruptAs: (id) =>
        Effect.Effect(function* () {
          return yield* Effect.wait(
            raceFuture(
              yield* pipe(first.interruptAs(id), Effect.flatMap(Effect.fromExit), Effect.fork),
              yield* pipe(second.interruptAs(id), Effect.flatMap(Effect.fromExit), Effect.fork),
              false,
            ),
          )
        }),
    })
  }
}

const combineConcurrent = Exit.makeConcurrentSemigroup<any, readonly any[]>(RA.getSemigroup<any>())

function zipFuture<E, A, E2, B>(
  first: RuntimeFiber<E, A>,
  second: RuntimeFiber<E2, B>,
): Future<never, never, Exit.Exit<E | E2, readonly [A, B]>> {
  const future = pending<never, never, Exit.Exit<E | E2, readonly any[]>>()

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
        pipe(
          Effect.lazy<never, never, Exit.Exit<E | E2, A | B>>(() =>
            index === 0
              ? (secondDisposable.dispose(), second.interruptAs(first.id))
              : (firstDisposable.dispose(), first.interruptAs(second.id)),
          ),
          Effect.map((exit2: Exit.Exit<E | E2, A | B>) =>
            index === 0
              ? combineConcurrent.combine(Either.tupled(exit2))(exit)
              : combineConcurrent.combine(exit)(Either.tupled(exit2)),
          ),
        ),
      )
    } else if (firstExit && secondExit) {
      future.complete(Effect.of(combineConcurrent.combine(secondExit)(firstExit)))
    }
  }
}

function raceFuture<E, A, E2, B>(
  first: RuntimeFiber<E, A>,
  second: RuntimeFiber<E2, B>,
  shouldInterrupt: boolean,
): Future<never, never, Exit.Exit<E | E2, A | B>> {
  const future = pending<never, never, Exit.Exit<E | E2, A | B>>()

  const firstDisposable = first.addObserver((exit) => onExit(exit, 0))
  const secondDisposable = second.addObserver((exit) => onExit(exit, 1))

  return future

  function onExit(exit: Exit.Exit<E | E2, A | B>, index: 0 | 1) {
    firstDisposable.dispose()
    secondDisposable.dispose()

    if (shouldInterrupt) {
      future.complete(
        pipe(
          index === 0 ? second.interruptAs(first.id) : first.interruptAs(second.id),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Effect.map((_: Exit.Exit<E | E2, A | B>) => exit),
        ),
      )
    } else {
      future.complete(Effect.of(exit))
    }
  }
}

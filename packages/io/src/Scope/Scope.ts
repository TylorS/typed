import { Tag } from '@fp-ts/data/Context'
import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { getSequentialSemigroup } from '@typed/cause'
import { Disposable } from '@typed/disposable'
import { Exit } from '@typed/exit'

import { forkDaemon } from '../DefaultServices/DefaultServices.js'
import { Effect } from '../Effect/Effect.js'
import { gen } from '../Effect/Instruction.js'
import * as ops from '../Effect/operators.js'
import { RuntimeFiber } from '../Fiber/Fiber.js'

export interface Scope {
  readonly addFinalizer: (finalizer: Finalizer) => Effect.Of<Disposable>
  readonly close: (exit: Exit<any, any>) => Effect.Of<boolean>
  readonly fork: Effect.Of<Scope>
}

export const Scope = Tag<Scope>()

export function makeScope(): Scope {
  const finalizers: Array<Finalizer> = []
  let closed = false
  let finalExit: Option.Option<Exit<any, any>> = Option.none

  const addFinalizer: Scope['addFinalizer'] = (finalizer) =>
    ops.lazy(() =>
      closed && Option.isSome(finalExit)
        ? pipe(
            finalizer(finalExit.value),
            ops.map(() => Disposable.unit),
          )
        : ops.sync(() => {
            finalizers.push(finalizer)

            return Disposable(() => {
              const i = finalizers.indexOf(finalizer)

              if (i > -1) {
                finalizers.splice(i, 1)
              }
            })
          }),
    )

  const close: Scope['close'] = (exit) =>
    gen(function* () {
      if (Option.isSome(finalExit)) {
        return false
      }

      finalExit = Option.some(exit)

      for (const finalizer of finalizers) {
        const finalizerExit = yield* ops.attempt(finalizer(exit))

        if (Either.isLeft(finalizerExit)) {
          finalExit = pipe(
            finalExit,
            Option.map(Either.mapLeft(getSequentialSemigroup().combine(finalizerExit.left))),
          )
        }
      }

      closed = true

      return true
    })

  const fork = ops.uninterruptable(
    gen(function* () {
      const child = makeScope()
      const disposable = yield* addFinalizer((exit) => child.close(exit))

      yield* child.addFinalizer(() => ops.sync(() => disposable.dispose()))

      return child
    }),
  )

  return {
    addFinalizer,
    close,
    fork,
  }
}

export interface Finalizer {
  (exit: Exit<any, any>): Effect.Of<unknown>
}

export function scoped<R, E, A>(effect: Effect<R | Scope, E, A>): Effect<Exclude<R, Scope>, E, A> {
  return ops.lazy(() => {
    const scope = makeScope()

    return pipe(effect, ops.provideService(Scope, scope), ops.onExit(scope.close))
  })
}

export function forkScoped<R, E, A>(
  effect: Effect<R | Scope, E, A>,
): Effect<R | Scope, never, RuntimeFiber<E, A>> {
  return pipe(
    ops.asksEffect(Scope, (s) => s.fork),
    ops.flatMap((scope) =>
      pipe(
        ops.getFiberId,
        ops.flatMap((id) =>
          pipe(
            effect,
            ops.provideService(Scope, scope),
            ops.onExit(scope.close),
            forkDaemon,
            ops.tap((fiber) =>
              scope.addFinalizer(() =>
                pipe(
                  ops.getFiberId,
                  ops.flatMap(
                    (childId): Effect.Of<unknown> =>
                      childId === id ? ops.unit : fiber.interruptAs(id),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  )
}

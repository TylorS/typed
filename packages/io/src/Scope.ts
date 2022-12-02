import { Tag } from '@fp-ts/data/Context'
import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { getSequentialSemigroup } from '@typed/cause'
import { Disposable } from '@typed/disposable'
import { Exit } from '@typed/exit'

import { forkDaemon } from './DefaultServices.js'
import * as Effect from './Effect/Effect.js'
import { RuntimeFiber } from './Fiber.js'
import { asksEffect, provideService } from './operators.js'

export interface Scope {
  readonly addFinalizer: (finalizer: Finalizer) => Effect.Effect<never, never, Disposable>
  readonly close: (exit: Exit<any, any>) => Effect.Effect<never, never, boolean>
  readonly fork: Effect.Effect<never, never, Scope>
}

export const Scope = Tag<Scope>()

export function makeScope(): Scope {
  const finalizers: Array<Finalizer> = []
  let closed = false
  let finalExit: Option.Option<Exit<any, any>> = Option.none

  const addFinalizer: Scope['addFinalizer'] = (finalizer) =>
    Effect.lazy(() =>
      closed && Option.isSome(finalExit)
        ? pipe(
            finalizer(finalExit.value),
            Effect.map(() => Disposable.unit),
          )
        : Effect.sync(() => {
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
    Effect.Effect(function* () {
      if (Option.isSome(finalExit)) {
        return false
      }

      finalExit = Option.some(exit)

      for (const finalizer of finalizers) {
        const finalizerExit = yield* Effect.attempt(finalizer(exit))

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

  const fork = Effect.uninterruptable(
    Effect.Effect(function* () {
      const child = makeScope()
      const disposable = yield* addFinalizer((exit) => child.close(exit))

      yield* child.addFinalizer(() => Effect.sync(() => disposable.dispose()))

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
  (exit: Exit<any, any>): Effect.Effect<never, never, unknown>
}

export function scoped<R, E, A>(
  effect: Effect.Effect<R | Scope, E, A>,
): Effect.Effect<Exclude<R, Scope>, E, A> {
  return Effect.lazy(() => {
    const scope = makeScope()

    return pipe(effect, provideService(Scope, scope), Effect.onExit(scope.close))
  })
}

export function forkScoped<R, E, A>(
  effect: Effect.Effect<R | Scope, E, A>,
): Effect.Effect<R | Scope, never, RuntimeFiber<E, A>> {
  return pipe(
    asksEffect(Scope, (s) => s.fork),
    Effect.flatMap((scope) =>
      pipe(
        Effect.getFiberId,
        Effect.flatMap((id) =>
          pipe(
            effect,
            provideService(Scope, scope),
            Effect.onExit(scope.close),
            forkDaemon,
            Effect.tap((fiber) =>
              scope.addFinalizer(() =>
                pipe(
                  Effect.getFiberId,
                  Effect.flatMap(
                    (childId): Effect.Effect<never, never, unknown> =>
                      childId === id ? Effect.unit : fiber.interruptAs(id),
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

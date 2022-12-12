import { Tag } from '@fp-ts/data/Context'
import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { getSequentialSemigroup } from '@typed/cause'
import { Disposable } from '@typed/disposable'
import { Exit } from '@typed/exit'

import { Effect } from '../Effect/Effect.js'
import { gen } from '../Effect/Instruction.js'
import * as ops from '../Effect/operators.js'

export interface Scope {
  readonly addFinalizer: (finalizer: Finalizer) => Effect.Of<Disposable>
  readonly close: (exit: Exit<any, any>) => Effect.Of<boolean>
  readonly fork: Effect.Of<Scope>
}

const combineSeq = getSequentialSemigroup().combine

export const Scope = Object.assign(function makeScope(): Scope {
  const finalizers: Array<Finalizer> = []
  let closed = false
  let finalExit: Option.Option<Exit<any, any>> = Option.none

  const addFinalizer: Scope['addFinalizer'] = (finalizer) =>
    ops.lazy(() =>
      closed && Option.isSome(finalExit)
        ? finalizer(finalExit.value).map(() => Disposable.unit)
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
        const finalizerExit = yield* finalizer(exit).attempt

        if (Either.isLeft(finalizerExit)) {
          finalExit = pipe(finalExit, Option.map(Either.mapLeft(combineSeq(finalizerExit.left))))
        }
      }

      closed = true

      return true
    }).uninterruptable

  const fork = gen(function* () {
    const child = makeScope()
    const disposable = yield* addFinalizer((exit) => child.close(exit))

    yield* child.addFinalizer(() => ops.sync(() => disposable.dispose()))

    return child
  }).uninterruptable

  return {
    addFinalizer,
    close,
    fork,
  }
}, Tag<Scope>())

export interface Finalizer {
  (exit: Exit<any, any>): Effect.Of<unknown>
}

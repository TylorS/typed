import { right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { isSome } from 'fp-ts/Option'

import * as Fx from '@/Fx'

import { Managed } from './Managed'
import { ReleaseMap } from './ReleaseMap'

/**
 * Utilize a Managed type by applying a function to the resource created. The resources
 * will be tracked given the current scope in the case of failures, but will also be released
 * eagerly after your supplied function has been executed.
 */
export function withManaged<A, R2, E2, B>(_with: (a: A) => Fx.Fx<R2, E2, B>) {
  return <R, E>(managed: Managed<R, E, A>): Fx.Fx<R & R2, E | E2, B> => {
    return Fx.Fx(function* () {
      // Create our resource within an uninterruptable region to ensure we have no resouce
      // leaking.
      const [a, finalizer, dispose] = yield* Fx.uninterruptable(
        Fx.Fx(function* () {
          const releaseMap = new ReleaseMap()
          const requirements = yield* Fx.ask<R>('withManaged')
          const [finalizer, a] = yield* pipe(
            managed.fx,
            Fx.provideAll({ requirements, releaseMap }),
          )
          const scope = yield* Fx.getScope('withManaged')

          // Ensure if the Fiber fails this gets cleaned up
          const optionKey = scope.ensure(finalizer)

          const dispose = (): void => {
            if (isSome(optionKey)) {
              scope.cancel(optionKey.value)
            }
          }

          return [a, finalizer, dispose] as const
        }),
      )

      const b = yield* _with(a)

      yield* finalizer(right(a))
      // Clean up if we succeed too.
      dispose()

      return b
    })
  }
}

export { withManaged as with }

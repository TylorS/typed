import * as Either from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { prettyPrint } from '@/Cause'
import { makeRuntimeFiber } from '@/Fiber'
import { Fx } from '@/Fx'
import * as Scope from '@/Scope'

import { Stream } from '../Stream'

export const fromFx = <R, A>(fx: Fx<R, A>): Stream<R, A> => ({
  run: (sink, { scope, context }) => {
    const fiber = makeRuntimeFiber(fx, {
      scope: Scope.fork(scope),
      context,
    })

    pipe(
      fiber.scope,
      Scope.ensure(
        Either.match(
          (cause) => sink.error(new Error(prettyPrint(cause, context.renderer))),
          (a) =>
            Fx(function* () {
              yield* sink.event(a)
              yield* sink.end
            }),
        ),
      ),
    )

    return fiber
  },
})

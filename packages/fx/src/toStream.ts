import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Stream from '@effect/stream/Stream'

import { Fx, Sink } from './Fx.js'

export function toStream<R, E, A>(fx: Fx<R, E, A>): Stream.Stream<R, E, A> {
  return Stream.asyncEffect((emit) =>
    fx.run(
      Sink(
        (a) => Effect.promise(() => emit.single(a)),
        (cause) => Effect.promise(() => emit.done(Exit.failCause(cause))),
      ),
    ),
  )
}

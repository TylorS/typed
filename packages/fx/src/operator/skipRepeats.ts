import * as Effect from '@effect/io/Effect'
import { equals } from '@fp-ts/data/Equal'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'

export function skipRepeatsWith<A>(equals: (first: A, second: A) => boolean) {
  return <R, E>(self: Fx<R, E, A>): Fx<R, E, A> => new SkipRepeatsWithFx(self, equals)
}

export function skipRepeats<R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
  return pipe(
    fx,
    skipRepeatsWith<A>((first, second) => equals(second)(first)),
  )
}

export class SkipRepeatsWithFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly self: Fx<R, E, A>, readonly equals: (first: A, second: A) => boolean) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return Effect.suspendSucceed(() => {
      let previous: Option.Option<A> = Option.none

      return this.self.run({
        ...sink,
        event: (a) =>
          Effect.suspendSucceed(() => {
            if (Option.isNone(previous) || !this.equals(previous.value, a)) {
              previous = Option.some(a)

              return sink.event(a)
            }

            return Effect.unit()
          }),
      })
    })
  }
}

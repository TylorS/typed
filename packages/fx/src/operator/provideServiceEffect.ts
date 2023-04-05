import type * as Context from '@effect/data/Context'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import { Fx } from '../Fx.js'

export function provideServiceEffect<I, S, R2, E2>(
  tag: Context.Tag<I, S>,
  service: Effect.Effect<R2, E2, S>,
) {
  return <R, E, A>(self: Fx<R, E, A>): Fx<Exclude<R | R2, I>, E | E2, A> =>
    new ProvideServiceEffectFx(self, tag, service)
}

class ProvideServiceEffectFx<R, E, A, R2, E2, I, S>
  extends Fx.Variance<Exclude<R | R2, I>, E | E2, A>
  implements Fx<Exclude<R | R2, I>, E | E2, A>
{
  constructor(
    readonly self: Fx<R | I, E, A>,
    readonly tag: Context.Tag<I, S>,
    readonly service: Effect.Effect<R2, E2, S>,
  ) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    return pipe(
      this.self.run(sink),
      Effect.provideServiceEffect(this.tag, this.service),
      Effect.matchCauseEffect(sink.error, Effect.succeed),
    ) as Effect.Effect<Exclude<R | R2 | R3 | Scope, I>, never, unknown>
  }
}

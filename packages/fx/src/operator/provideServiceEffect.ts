import * as Effect from '@effect/io/Effect'
import { Scope } from '@effect/io/Scope'
import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function provideServiceEffect<S, R2, E2>(
  tag: Context.Tag<S>,
  service: Effect.Effect<R2, E2, S>,
) {
  return <R, E, A>(self: Fx<R | S, E, A>): Fx<Exclude<R | R2, S>, E | E2, A> =>
    new ProvideServiceFx(self, tag, service)
}

export class ProvideServiceFx<R, E, A, R2, E2, S>
  extends Fx.Variance<Exclude<R | R2, S>, E | E2, A>
  implements Fx<Exclude<R | R2, S>, E | E2, A>
{
  constructor(
    readonly self: Fx<R | S, E, A>,
    readonly tag: Context.Tag<S>,
    readonly service: Effect.Effect<R2, E2, S>,
  ) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    return pipe(
      this.self.run(sink),
      Effect.provideServiceEffect(this.tag)(this.service),
      Effect.foldCauseEffect(sink.error, Effect.succeed),
    ) as Effect.Effect<Exclude<R | R2 | R3 | Scope, S>, never, unknown>
  }
}

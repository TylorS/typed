import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'
import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function provideEnvironment<R>(context: Context.Context<R>) {
  return <E, A>(self: Fx<R, E, A>): Fx<never, E, A> => new ProvideEnvironmentFx(self, context)
}

class ProvideEnvironmentFx<R, E, A> extends Fx.Variance<never, E, A> implements Fx<never, E, A> {
  constructor(readonly self: Fx<R, E, A>, readonly context: Context.Context<R>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return pipe(
      this.self.run(sink),
      Effect.provideSomeEnvironment<R2 | Scope, R | R2 | Scope>(Context.merge(this.context)),
    )
  }
}

import * as Effect from '@effect/io/Effect'
import { Scope } from '@effect/io/Scope'
import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function provideSomeEnvironment<R2>(context: Context.Context<R2>) {
  return <R, E, A>(self: Fx<R | R2, E, A>): Fx<Exclude<R, R2>, E, A> =>
    new ProvideSomeEnvironmentFx(self, context)
}

class ProvideSomeEnvironmentFx<R, R2, E, A>
  extends Fx.Variance<Exclude<R, R2>, E, A>
  implements Fx<Exclude<R, R2>, E, A>
{
  constructor(readonly self: Fx<R | R2, E, A>, readonly context: Context.Context<R2>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E, A>) {
    return pipe(
      this.self.run(sink),
      Effect.provideSomeEnvironment<Exclude<R, R2> | R3 | Scope, R | R2 | R3 | Scope>((ctx) =>
        Context.merge(this.context)(ctx as Context.Context<R | R3 | Scope>),
      ),
    )
  }
}

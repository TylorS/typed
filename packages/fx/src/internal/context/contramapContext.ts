import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Context, Effect, Option, Scope } from '@typed/fx/internal/_externals'

export const contramapContext: {
  <R1, R2, E, A>(fx: Fx<R2, E, A>, f: (r: Context.Context<R1>) => Context.Context<R2>): Fx<R1, E, A>

  <R1, R2>(f: (r: Context.Context<R1>) => Context.Context<R2>): <E, A>(
    fx: Fx<R2, E, A>,
  ) => Fx<R1, E, A>
} = dualWithTrace(
  2,
  (trace, restore) =>
    <R1, R2, E, A>(
      fx: Fx<R2, E, A>,
      f: (r: Context.Context<R1>) => Context.Context<R2>,
    ): Fx<R1, E, A> =>
      new ContramapContextFx(fx, restore(f)).traced(trace),
)

export class ContramapContextFx<R1, R2, E, A> extends BaseFx<R1, E, A> {
  readonly name = 'ContramapContext'

  constructor(
    readonly fx: Fx<R2, E, A>,
    readonly f: (r: Context.Context<R1>) => Context.Context<R2>,
  ) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<R1 | Scope.Scope, never, unknown> {
    const { f, fx } = this

    return Effect.scopeWith((scope) =>
      Effect.contramapContext(fx.run(sink), (r1: Context.Context<R1>) => {
        const r2 = f(r1)

        if (Option.isSome(Context.getOption(r2, Scope.Scope))) {
          return r2 as Context.Context<R2 | Scope.Scope>
        }

        return Context.add(Scope.Scope, scope)(r2)
      }),
    )
  }
}

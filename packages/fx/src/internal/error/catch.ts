import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import type { Context, Scope } from '@typed/fx/internal/externals'
import { Cause, Effect, Either, pipe } from '@typed/fx/internal/externals'

const catch_: {
  <R, E, A, N extends keyof E, K extends E[N] & string, R2, E2, B>(
    fx: Fx<R, E, A>,
    tag: N,
    k: K,
    f: (e: Extract<E, { readonly [_ in N]: K }>) => Fx<R2, E2, B>,
  ): Fx<R | R2, E | E2, A | B>
  <E, N extends keyof E, K extends E[N] & string, R2, E2, B>(
    tag: N,
    k: K,
    f: (e: Extract<E, { readonly [_ in N]: K }>) => Fx<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E | E2, B | A>
} = dualWithTrace<any, any>(
  4,
  (trace) =>
    <R, E, A, N extends keyof E, K extends E[N] & string, R2, E2, B>(
      fx: Fx<R, E, A>,
      tag: N,
      k: K,
      f: (e: Extract<E, { readonly [_ in N]: K }>) => Fx<R2, E2, B>,
    ): Fx<R | R2, E | E2, A | B> =>
      new CatchFx(fx, tag, k, f).traced(trace),
)

export { catch_ as catch }

export class CatchFx<R, E, A, N extends keyof E, K extends E[N] & string, R2, E2, B> extends BaseFx<
  R | R2,
  E | E2,
  A | B
> {
  readonly name = 'Catch' as const

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly tag: N,
    readonly k: K,
    readonly f: (e: Extract<E, { readonly [_ in N]: K }>) => Fx<R2, E2, B>,
  ) {
    super()
  }

  run(sink: Sink<E | E2, A | B>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope.Scope>) =>
      this.fx.run(
        Sink(
          sink.event,
          (cause) =>
            pipe(
              cause,
              Cause.failureOrCause,
              Either.match(
                (e) => (this.isExpectedError(e) ? this.f(e).run(sink) : sink.error(cause)),
                sink.error,
              ),
              Effect.provideContext(ctx),
            ),
          sink.end,
        ),
      ),
    )
  }

  isExpectedError = (e: E): e is Extract<E, { readonly [_ in N]: K }> =>
    typeof e === 'object' && e !== null && this.tag in e && e[this.tag] === this.k
}

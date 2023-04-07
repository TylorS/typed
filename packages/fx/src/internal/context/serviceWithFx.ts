import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import type { Context, Scope } from '@typed/fx/internal/externals'
import { Debug, Effect } from '@typed/fx/internal/externals'

export const serviceWithFx: {
  <I, A, R2, E2, B>(tag: Context.Tag<I, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R2 | I, E2, B>
  <I, A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): (tag: Context.Tag<I, A>) => Fx<R2 | I, E2, B>
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <I, A, R2, E2, B>(tag: Context.Tag<I, A>, f: (a: A) => Fx<R2, E2, B>) =>
      new ServiceWithFx(tag, f).traced(trace),
)

export class ServiceWithFx<I, A, R, E, B> extends BaseFx<R | I, E, B> {
  readonly name = 'ServiceWithFx' as const

  constructor(readonly tag: Context.Tag<I, A>, readonly f: (a: A) => Fx<R, E, B>) {
    super()
  }

  run(sink: Sink<E, B>): Effect.Effect<R | I | Scope.Scope, never, unknown> {
    return Effect.flatMap(this.tag, (a) => this.f(a).run(sink))
  }
}

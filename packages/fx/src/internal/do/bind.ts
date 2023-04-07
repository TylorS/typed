import { dualWithTrace } from '@effect/data/Debug'

import { Effect, Scope } from '../externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { flatMap } from '@typed/fx/internal/operator/flatMap'
import { map } from '@typed/fx/internal/operator/map'

export const bind: {
  <R, E, N extends string, K, R2, E2, A>(
    self: Fx<R, E, K>,
    tag: Exclude<N, keyof K>,
    f: (_: K) => Fx<R2, E2, A>,
  ): Fx<R | R2, E | E2, MergeObjects<K, { readonly [_ in N]: A }>>

  <N extends string, K, R2, E2, A>(tag: Exclude<N, keyof K>, f: (_: K) => Fx<R2, E2, A>): <R, E>(
    self: Fx<R, E, K>,
  ) => Fx<R | R2, E | E2, MergeObjects<K, { readonly [_ in N]: A }>>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, N extends string, K, R2, E2, A>(
      self: Fx<R, E, K>,
      tag: Exclude<N, keyof K>,
      f: (_: K) => Fx<R2, E2, A>,
    ) =>
      new BindFx(self, tag, f).traced(trace),
)

type MergeObjects<T, U> = {
  readonly [K in keyof T | keyof U]: K extends keyof T ? T[K] : K extends keyof U ? U[K] : never
}

export class BindFx<R, E, N extends string, K, R2, E2, A> extends BaseFx<
  R | R2,
  E | E2,
  MergeObjects<K, { readonly [_ in N]: A }>
> {
  readonly name = 'Bind'

  constructor(
    readonly self: Fx<R, E, K>,
    readonly tag: Exclude<N, keyof K>,
    readonly f: (_: K) => Fx<R2, E2, A>,
  ) {
    super()
  }

  run(
    sink: Sink<E | E2, MergeObjects<K, { readonly [_ in N]: A }>>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return flatMap(this.self, (k) => map(this.f(k), (a) => ({ ...k, [this.tag]: a } as any))).run(
      sink,
    )
  }
}

import { dualWithTrace } from '@effect/data/Debug'

import { Effect, Scope } from '../_externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { map } from '@typed/fx/internal/operator/map'

export const bindValue: {
  <R, E, N extends string, K, A>(self: Fx<R, E, K>, tag: Exclude<N, keyof K>, f: (_: K) => A): Fx<
    R,
    E,
    MergeObjects<K, { readonly [_ in N]: A }>
  >

  <N extends string, K, A>(tag: Exclude<N, keyof K>, f: (_: K) => A): <R, E>(
    self: Fx<R, E, K>,
  ) => Fx<R, E, MergeObjects<K, { readonly [_ in N]: A }>>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, N extends string, K, A>(self: Fx<R, E, K>, tag: Exclude<N, keyof K>, f: (_: K) => A) =>
      new BindValueFx(self, tag, f).traced(trace),
)

type MergeObjects<T, U> = {
  readonly [K in keyof T | keyof U]: K extends keyof T ? T[K] : K extends keyof U ? U[K] : never
}

export class BindValueFx<R, E, N extends string, K, A> extends BaseFx<
  R,
  E,
  MergeObjects<K, { readonly [_ in N]: A }>
> {
  readonly name = 'Bind'

  constructor(
    readonly self: Fx<R, E, K>,
    readonly tag: Exclude<N, keyof K>,
    readonly f: (_: K) => A,
  ) {
    super()
  }

  run(
    sink: Sink<E, MergeObjects<K, { readonly [_ in N]: A }>>,
  ): Effect.Effect<R | Scope.Scope, never, unknown> {
    return map(this.self, (k) => ({ ...k, [this.tag]: this.f(k) } as any)).run(sink)
  }
}

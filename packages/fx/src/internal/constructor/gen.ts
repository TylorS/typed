import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { fromFxEffect } from '@typed/fx/internal/conversion/fromFxEffect'
import type { Scope } from '@typed/fx/internal/externals'

export const gen: <Eff extends Effect.EffectGen<any, any, any>, R, E, A>(
  f: (resume: Effect.Adapter) => Generator<Eff, Fx<R, E, A>, unknown>,
) => Fx<R | Exclude<EffectGenResources<Eff>, Scope.Scope>, E | EffectGenErrors<Eff>, A> =
  methodWithTrace(
    (trace) =>
      <Eff extends Effect.EffectGen<any, any, any>, R, E, A>(
        f: (resume: Effect.Adapter) => Generator<Eff, Fx<R, E, A>>,
      ): Fx<R | Exclude<EffectGenResources<Eff>, Scope.Scope>, E | EffectGenErrors<Eff>, A> =>
        new GenFx(f).traced(trace),
  )

export class GenFx<Eff extends Effect.EffectGen<any, any, any>, R, E, A> extends BaseFx<
  R | Exclude<EffectGenResources<Eff>, Scope.Scope>,
  E | EffectGenErrors<Eff>,
  A
> {
  readonly name = 'Gen' as const

  constructor(readonly f: (resume: Effect.Adapter) => Generator<Eff, Fx<R, E, A>>) {
    super()
  }

  /**
   * @macro traced
   */
  run(sink: Sink<E | EffectGenErrors<Eff>, A>) {
    return fromFxEffect<EffectGenResources<Eff>, EffectGenErrors<Eff>, R, E, A>(
      Effect.gen(this.f),
    ).run(sink)
  }
}

export type EffectGenResources<Eff> = [Eff] extends [never]
  ? never
  : [Eff] extends [Effect.EffectGen<infer R, any, any>]
  ? R
  : never

export type EffectGenErrors<Eff> = [Eff] extends [never]
  ? never
  : [Eff] extends [Effect.EffectGen<any, infer E, any>]
  ? E
  : never

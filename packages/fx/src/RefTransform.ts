import * as Equal from '@effect/data/Equal'
import { pipe, identity } from '@effect/data/Function'
import * as Hash from '@effect/data/Hash'
import * as MutableRef from '@effect/data/MutableRef'
import * as Option from '@effect/data/Option'
import { Pipeable, pipeArguments } from '@effect/data/Pipeable'
import * as Effect from '@effect/io/Effect'

import * as Fx from './Fx.js'

const fxVariance = {
  _R: identity,
  _E: identity,
  _A: identity,
}

export interface RefTransformInput<R, E, A, R2, E2, B> extends Fx.Fx<R, E, A> {
  readonly get: Effect.Effect<R2, E2, B>

  /** @internal */
  readonly version: () => number
}

export interface RefTransform<R, E, A, R2, E2, B>
  extends Fx.Fx<R, E, A>,
    Effect.Effect<R2, E2, B>,
    Pipeable {
  readonly get: Effect.Effect<R2, E2, B>

  transform<R3, E3, C>(
    f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
  ): RefTransform<R3, E3, C, R2, E2, B>

  transformGet<R3, E3, C>(
    f: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R3, E3, C>,
  ): RefTransform<R, E, A, R3, E3, C>

  transformBoth<R3, E3, C, R4, E4, D>(
    f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
    g: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>,
  ): RefTransform<R3, E3, C, R4, E4, D>

  /** @internal */
  readonly version: () => number
}

export class RefTransformImpl<R0, E0, A0, R1, E1, A1, R2, E2, B, R3, E3, C>
  implements RefTransform<R2, E2, B, R3, E3, C>
{
  readonly _tag = 'Commit';
  readonly [Effect.EffectTypeId] = fxVariance;

  readonly [Fx.FxTypeId] = fxVariance

  readonly fx: Fx.Fx<R2, E2, B>
  readonly get: Effect.Effect<R3, E3, C>

  protected _lastVersion: number
  protected _currentValue: MutableRef.MutableRef<Option.Option<C>> = MutableRef.make(Option.none())

  constructor(
    readonly i0: RefTransformInput<R0, E0, A0, R1, E1, A1>,
    readonly i1: (fx: Fx.Fx<R0, E0, A0>) => Fx.Fx<R2, E2, B>,
    readonly i2: (effect: Effect.Effect<R1, E1, A1>) => Effect.Effect<R3, E3, C>,
  ) {
    this.fx = i1(i0)

    this._lastVersion = i0.version()

    this.get = Effect.suspend(() => {
      const currentVersion = i0.version()
      const currentValue = MutableRef.get(this._currentValue)

      // Avoid computing a new value when the underlying ref hasn't changed
      if (currentVersion === this._lastVersion && Option.isSome(currentValue)) {
        return Effect.succeed(currentValue.value)
      }

      return Effect.flatMap(i2(i0.get), (value) =>
        Effect.sync(() => {
          this._lastVersion = i0.version()

          MutableRef.set(this._currentValue, Option.some(value))

          return value
        }),
      )
    })
  }

  run<R4>(sink: Fx.Sink<R4, E2, B>) {
    return this.fx.run(sink)
  }

  transform<R4, E4, D>(f: (fx: Fx.Fx<R2, E2, B>) => Fx.Fx<R4, E4, D>) {
    return new RefTransformImpl(this.i0, (a) => pipe(a, this.i1, f), this.i2)
  }

  transformGet<R4, E4, D>(f: (effect: Effect.Effect<R3, E3, C>) => Effect.Effect<R4, E4, D>) {
    return new RefTransformImpl(this.i0, this.i1, (a) => pipe(a, this.i2, f))
  }

  transformBoth<R4, E4, D, R5, E5, E>(
    f: (fx: Fx.Fx<R2, E2, B>) => Fx.Fx<R4, E4, D>,
    g: (effect: Effect.Effect<R3, E3, C>) => Effect.Effect<R5, E5, E>,
  ): RefTransformImpl<R0, E0, A0, R1, E1, A1, R4, E4, D, R5, E5, E> {
    return new RefTransformImpl(
      this.i0,
      (a) => pipe(a, this.i1, f),
      (a) => pipe(a, this.i2, g),
    )
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  }

  version() {
    return this.i0.version()
  }

  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  commit() {
    return this.get
  }
}

import * as Equal from '@effect/data/Equal'
import { pipe, identity } from '@effect/data/Function'
import * as Hash from '@effect/data/Hash'
import * as MutableRef from '@effect/data/MutableRef'
import * as Option from '@effect/data/Option'
import { Pipeable, pipeArguments } from '@effect/data/Pipeable'
import * as Effect from '@effect/io/Effect'
import * as Channel from '@effect/stream/Channel'
import * as Sink from '@effect/stream/Sink'
import * as Stream from '@effect/stream/Stream'

import * as Fx from './Fx.js'
import { combineAll } from './combineAll.js'

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

export namespace RefTransformInput {
  export type Any = RefTransform<any, any, any, any, any, any>
  export type TupleAny = ReadonlyArray<Any>

  export type FxContext<T> = [T] extends [never]
    ? never
    : T extends RefTransformInput<infer R, any, any, any, any, any>
    ? R
    : never

  export type FxError<T> = [T] extends [never]
    ? never
    : T extends RefTransformInput<any, infer E, any, any, any, any>
    ? E
    : never

  export type FxSuccess<T> = [T] extends [never]
    ? never
    : T extends RefTransformInput<any, any, infer A, any, any, any>
    ? A
    : never

  export type Fx<T> = [T] extends [never]
    ? never
    : T extends RefTransformInput<infer R, infer E, infer A, any, any, any>
    ? Fx.Fx<R, E, A>
    : never

  export type GetContext<T> = [T] extends [never]
    ? never
    : T extends RefTransformInput<any, any, any, infer R, any, any>
    ? R
    : never

  export type GetError<T> = [T] extends [never]
    ? never
    : T extends RefTransformInput<any, any, any, any, infer E, any>
    ? E
    : never

  export type GetSuccess<T> = [T] extends [never]
    ? never
    : T extends RefTransformInput<any, any, any, any, any, infer A>
    ? A
    : never

  export type Get<T> = [T] extends [never]
    ? never
    : T extends RefTransformInput<any, any, any, infer R, infer E, infer A>
    ? Effect.Effect<R, E, A>
    : never

  export function tuple<const Inputs extends TupleAny>(
    inputs: Inputs,
  ): RefTransformInput<
    FxContext<Inputs[number]>,
    FxError<Inputs[number]>,
    { readonly [K in keyof Inputs]: FxSuccess<Inputs[K]> },
    GetContext<Inputs[number]>,
    GetError<Inputs[number]>,
    { readonly [K in keyof Inputs]: GetSuccess<Inputs[K]> }
  > {
    return Object.assign(combineAll(...inputs), {
      get: Effect.all(inputs.map((input) => input.get)),
      version: () => inputs.reduce((acc, input) => Math.max(acc, input.version()), 0),
    }) as any
  }
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
  readonly [Sink.SinkTypeId] = fxVariance as any;
  readonly [Channel.ChannelTypeId] = fxVariance as any;
  readonly [Stream.StreamTypeId] = fxVariance as any;

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

import { identity } from '@effect/data/Function'
import { Pipeable, pipeArguments } from '@effect/data/Pipeable'
import type { Cause } from '@effect/io/Cause'
import type { Effect } from '@effect/io/Effect'
import type * as Runtime from '@effect/io/Runtime'

export const FxTypeId = Symbol.for('@typed/fx/Fx')
export type FxTypeId = typeof FxTypeId

export interface Fx<out R, out E, out A> extends Pipeable {
  readonly [FxTypeId]: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }

  readonly run: <R2>(sink: Sink<R2, E, A>) => Effect<R | R2, never, void>
}

const fxVariance = {
  _R: identity,
  _E: identity,
  _A: identity,
}

const proto = {
  [FxTypeId]: fxVariance,
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  },
}

export const make: <R, E, A>(
  run: <R2>(sink: Sink<R2, E, A>) => Effect<R | R2, never, void>,
) => Fx<R, E, A> = function Fx<R, E, A>(run: Fx<R, E, A>['run']): Fx<R, E, A> {
  const fx = Object.create(proto)

  fx.run = run

  return fx
}

export function Fx<R, E, A>(
  run: <R2>(sink: Sink<R2, E, A>) => Effect<R | R2, never, void>,
): Fx<R, E, A> {
  return make(run)
}

export namespace Fx {
  export type Any = Fx<any, any, any>
  export type TupleAny = ReadonlyArray<Any>

  export type Cancel = Runtime.Cancel<never, void>

  export type ResourcesOf<T> = [T] extends [never]
    ? never
    : T extends Fx<infer R, any, any>
    ? R
    : never

  export type ErrorsOf<T> = [T] extends [never]
    ? never
    : T extends Fx<any, infer E, any>
    ? E
    : never

  export type OutputOf<T> = [T] extends [never]
    ? never
    : T extends Fx<any, any, infer A>
    ? A
    : never
}

export interface Sink<R, E, A> {
  readonly event: (a: A) => Effect<R, never, void>
  readonly error: (e: Cause<E>) => Effect<R, never, void>
}

export function Sink<A, R, E, R2>(
  event: (a: A) => Effect<R, never, void>,
  error: (e: Cause<E>) => Effect<R2, never, void>,
): Sink<R | R2, E, A> {
  return {
    event,
    error,
  }
}

export function isFx<R, E, A>(v: unknown): v is Fx<R, E, A> {
  return typeof v === 'object' && v != null && FxTypeId in v
}

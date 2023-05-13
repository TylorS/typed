import type { Trace } from "@effect/data/Debug"
import { identity } from "@effect/data/Function"
import type { Cause } from "@effect/io/Cause"
import type { Effect } from "@effect/io/Effect"

export const FxTypeId = Symbol.for("@typed/fx/Fx")
export type FxTypeId = typeof FxTypeId

export interface Fx<out R, out E, out A> {
  readonly [FxTypeId]: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }

  run<R2>(sink: Sink<R2, E, A>): Effect<R | R2, never, void>

  /**@internal */
  instanceof<T extends new (...args: any) => Fx<any, any, any>>(
    this: Fx<R, E, A>,
    ctor: T,
  ): this is InstanceType<T> & Fx<R, E, A>
}

const variance = {
  _R: identity,
  _E: identity,
  _A: identity,
}

export abstract class BaseFx<R, E, A> implements Fx<R, E, A> {
  readonly [FxTypeId] = variance

  constructor(readonly trace?: Trace) {}

  abstract run<R2>(sink: Sink<R2, E, A>): Effect<R | R2, never, void>

  instanceof<T extends new (...args: any) => Fx<any, any, any>>(
    this: Fx<R, E, A>,
    ctor: T,
  ): this is InstanceType<T> & Fx<R, E, A> {
    return this.constructor === ctor
  }
}

class RunFx<R, E, A> extends BaseFx<R, E, A> implements Fx<R, E, A> {
  constructor(readonly run: Fx<R, E, A>["run"], trace?: Trace) {
    super(trace)
  }
}

export function Fx<R, E, A>(run: Fx<R, E, A>["run"]): Fx<R, E, A> {
  return new RunFx(run)
}

export namespace Fx {
  export type Context<T> = [T] extends [never]
    ? never
    : T extends Fx<infer R, any, any>
    ? R
    : never

  export type Error<T> = [T] extends [never]
    ? never
    : T extends Fx<any, infer E, any>
    ? E
    : never

  export type Success<T> = [T] extends [never]
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
  return typeof v === "object" && v != null && FxTypeId in v
}

import { Context, Tag } from '@fp-ts/data/Context'
import { Either } from '@fp-ts/data/Either'
import { identity } from '@fp-ts/data/Function'
import type { Cause } from '@typed/cause'
import { Exit } from '@typed/exit'

import type { RuntimeFiber } from '../Fiber/index.js'
import type { FiberRefs } from '../FiberRefs.js'
import type { RuntimeOptions } from '../FiberRuntime.js'
import type { Layer } from '../Layer/Layer.js'
import { RuntimeFlags } from '../RuntimeFlags.js'

export interface Effect<out Resources, out Errors, out Output>
  extends Effect.Variance<Resources, Errors, Output> {
  readonly [Symbol.iterator]: () => Generator<Effect<Resources, Errors, Output>, Output, Output>

  readonly as: <B>(value: B, __trace?: string) => Effect<Resources, Errors, B>

  readonly map: <Output2>(
    f: (a: Output) => Output2,
    __trace?: string,
  ) => Effect<Resources, Errors, Output2>

  readonly causedBy: <Errors2>(
    cause: Cause<Errors2>,
    __trace?: string,
  ) => Effect<Resources, Errors | Errors2, never>

  readonly mapCause: <Errors2>(
    f: (a: Cause<Errors>) => Cause<Errors2>,
    __trace?: string,
  ) => Effect<Resources, Errors2, Output>

  readonly mapError: <Errors2>(
    f: (a: Errors) => Errors2,
    __trace?: string,
  ) => Effect<Resources, Errors2, Output>

  readonly flatMap: <Resources2, Errors2, Output2>(
    f: (a: Output) => Effect<Resources2, Errors2, Output2>,
    __trace?: string,
  ) => Effect<Resources | Resources2, Errors | Errors2, Output2>

  readonly flatMapCause: <Resources2, Errors2, Output2>(
    f: (a: Cause<Errors>) => Effect<Resources2, Errors2, Output2>,
    __trace?: string,
  ) => Effect<Resources | Resources2, Errors2, Output | Output2>

  readonly flatMapError: <Resources2, Errors2, Output2>(
    f: (a: Errors) => Effect<Resources2, Errors2, Output2>,
    __trace?: string,
  ) => Effect<Resources | Resources2, Errors2, Output | Output2>

  readonly matchCause: <Resources2, Errors2, Output2, Resources3, Errors3, Output3>(
    onFailure: (cause: Cause<Errors>) => Effect<Resources2, Errors2, Output2>,
    onSuccess: (value: Output) => Effect<Resources3, Errors3, Output3>,
    __trace?: string,
  ) => Effect<Resources | Resources2 | Resources3, Errors2 | Errors3, Output2 | Output3>

  readonly matchError: <Resources2, Errors2, Output2, Resources3, Errors3, Output3>(
    onFailure: (error: Errors) => Effect<Resources2, Errors2, Output2>,
    onSuccess: (value: Output) => Effect<Resources3, Errors3, Output3>,
    __trace?: string,
  ) => Effect<Resources | Resources2 | Resources3, Errors2 | Errors3, Output2 | Output3>

  readonly tap: <Resources2, Errors2, Output2>(
    f: (a: Output) => Effect<Resources2, Errors2, Output2>,
    __trace?: string,
  ) => Effect<Resources | Resources2, Errors | Errors2, Output>

  readonly tapCause: <Resources2, Errors2, Output2>(
    f: (a: Cause<Errors>) => Effect<Resources2, Errors2, Output2>,
    __trace?: string,
  ) => Effect<Resources | Resources2, Errors | Errors2, Output>

  readonly tapError: <Resources2, Errors2, Output2>(
    f: (a: Errors) => Effect<Resources2, Errors2, Output2>,
    __trace?: string,
  ) => Effect<Resources | Resources2, Errors | Errors2, Output>

  readonly attempt: Effect<Resources, never, Exit<Errors, Output>>

  readonly either: Effect<Resources, never, Either<Errors, Output>>

  readonly ensuring: <Resources2, Errors2, Output2>(
    finalizer: (exit: Exit<Errors, Output>) => Effect<Resources2, Errors2, Output2>,
    __trace?: string,
  ) => Effect<Resources | Resources2, Errors | Errors2, Output>

  readonly fork: (
    options?: Partial<RuntimeOptions<Resources>>,
    __trace?: string,
  ) => Effect<Resources, never, RuntimeFiber<Errors, Output>>

  readonly provideContext: (
    context: Context<Resources>,
    __trace?: string,
  ) => Effect<never, Errors, Output>

  readonly provide: <S>(
    context: Context<S>,
    __trace?: string,
  ) => Effect<Exclude<Resources, S>, Errors, Output>

  readonly provideService: <S>(
    tag: Tag<S>,
    service: S,
    __trace?: string,
  ) => Effect<Exclude<Resources, S>, Errors, Output>

  readonly provideLayer: <R2, E2, I, S>(
    layer: Layer<R2, E2, I, S>,
    __trace?: string,
  ) => Effect<R2 | Exclude<Resources, S>, Errors | E2, Output>

  readonly withFiberRefs: (refs: FiberRefs, __trace?: string) => Effect<Resources, Errors, Output>

  // TODO: Locally provide a FiberRef

  readonly updateRuntimeFlags: (
    f: (flags: RuntimeFlags) => RuntimeFlags,
    __trace?: string,
  ) => Effect<Resources, Errors, Output>

  readonly interruptable: Effect<Resources, Errors, Output>

  readonly uninterruptable: Effect<Resources, Errors, Output>
}

export namespace Effect {
  export const TypeId = Symbol.for('@typed/io/Effect')
  export type TypeId = typeof TypeId

  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = [T] extends [never]
    ? never
    : [T] extends [Effect<infer R, infer _E, infer _A>]
    ? R
    : never
  export type ErrorsOf<T> = [T] extends [never]
    ? never
    : [T] extends [Effect<infer _R, infer E, infer _A>]
    ? E
    : never
  export type OutputOf<T> = [T] extends [never]
    ? never
    : [T] extends [Effect<infer _R, infer _E, infer A>]
    ? A
    : never
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * This is utilized to help TypeScript understand the variance of the Effect
   * within the type system. This helps ensure that inference works as expected.
   */
  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }

  export const Variance: Variance<any, any, any>[TypeId] = {
    _R: identity,
    _E: identity,
    _A: identity,
  }

  export interface Of<A> extends Effect<never, never, A> {}

  export interface IO<E, A> extends Effect<never, E, A> {}

  export interface RIO<R, A> extends Effect<R, never, A> {}
}

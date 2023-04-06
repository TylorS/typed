/**
 * A `Fx` is a push-based reactive data structure that declaratively represents multi-shot Effects.
 * An Fx can call its provided Sink 0 or more times, and then call Sink.error or Sink.end exactly once.
 *
 * With an Fx you can represent workflows that exist over time like RPC, DOM Event, and so much more.
 * You can skip, take, filter, and transform the events of an Fx. You can also easily create your own.
 *
 * @since 1.0.0
 */

import type { Trace } from '@effect/data/Debug'
import { methodWithTrace } from '@effect/data/Debug'
import type { Equal } from '@effect/data/Equal'
import type { TypeLambda } from '@effect/data/HKT'
import type { Cause } from '@effect/io/Cause'
import type { Effect } from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import type { Fiber } from '@typed/fx/internal/_externals'

/**
 * A `Fx` is a push-based reactive data structure that declaratively represents a multi-shot Effects.
 * An Fx can call its provided Sink 0 or more times, and then call Sink.error or Sink.end exactly once.
 *
 * It makes use of Scope to ensure that all resources are properly released including any "nested" Fx
 * being run by higher-order Fx operators like flatMap or switchMap but not limited to.
 *
 * Fx extends the EffectGen interface to allow being yield*ed in a Generator. It is a shortcut
 * to runCollectAll and is mostly useful in tests.
 * @since 1.0.0
 * @category Model
 */
export interface Fx<out Services, out Errors, out Output> extends Equal {
  readonly name: string

  /**
   * The main API for running an Fx.
   */
  run(sink: Sink<Errors, Output>): Effect<Services | Scope, never, unknown>

  /**
   * Add a trace to an Fx
   */

  traced(trace: Trace): Fx<Services, Errors, Output>

  /**
   * Transform the output of an Fx.
   */
  transform<R2 = never, E2 = never>(
    f: (effect: Effect<Services | Scope, never, unknown>) => Effect<R2 | Scope, E2, unknown>,
  ): Fx<Exclude<R2, Scope>, Errors | E2, Output>

  /**
   * Construct a new Fx by applying a Effectful function to every element of this Fx.
   */
  readonly observe: <R2, E2, B>(
    f: (o: Output) => Effect<R2, E2, B>,
  ) => Effect<Services | R2, Errors | E2, unknown>

  /**
   * Construct a new Fx by applying a Effectful function to every element of this Fx
   * and fork the resulting Effect.
   */
  readonly forkObserve: <R2, E2, B>(
    f: (o: Output) => Effect<R2, E2, B>,
  ) => Effect<Services | R2 | Scope, never, Fiber.RuntimeFiber<Errors | E2, unknown>>
}

export namespace Fx {
  /**
   * Extract the services of an Fx.
   * @since 1.0.0
   * @category Type-level
   */
  export type ResourcesOf<T> = T extends Fx<infer Services, any, any> ? Services : never

  /**
   * Extract the errors of an Fx.
   * @since 1.0.0
   * @category Type-level
   */
  export type ErrorsOf<T> = T extends Fx<any, infer Errors, any> ? Errors : never

  /**
   * Extract the output of an Fx.
   * @since 1.0.0
   * @category Type-level
   */
  export type OutputOf<T> = T extends Fx<any, any, infer Output> ? Output : never

  /**
   * An Fx which will always succeed with the given value.
   */
  export type Succeed<A> = Fx<never, never, A>

  /**
   * An Fx which will always fail with the given value.
   */
  export type Fail<E> = Fx<never, E, never>

  /**
   * An Fx which has an error and a value but not resources.
   */
  export type WithError<E, A> = Fx<never, E, A>

  /**
   * An Fx which has a resource and a value but not an error.
   */
  export type WithService<R, A> = Fx<R, never, A>
}

/**
 * A `Sink` is receiver of a `Fx`'s events and errors. It describes event and error.
 * @since 1.0.0
 * @category Model
 */
export interface Sink<in Errors, in Output> {
  readonly event: (event: Output) => Effect<never, never, unknown>
  readonly error: (error: Cause<Errors>) => Effect<never, never, unknown>
  readonly end: () => Effect<never, never, unknown>
}

/**
 * Construct a Sink.
 * @since 1.0.0
 * @category Constructor
 */
export function Sink<Errors, Output>(
  event: Sink<Errors, Output>['event'],
  error: Sink<Errors, Output>['error'],
  end: Sink<Errors, Output>['end'],
): Sink<Errors, Output> {
  const sink: Sink<Errors, Output> = {
    event: methodWithTrace((trace, restore) => (a) => restore(event)(a).traced(trace)),
    error: methodWithTrace((trace, restore) => (e) => restore(error)(e).traced(trace)),
    end: methodWithTrace((trace, restore) => () => restore(end)().traced(trace)),
  }

  return sink
}

export namespace Sink {
  export function traced<Errors, Output>(
    sink: Sink<Errors, Output>,
    trace: Trace,
  ): Sink<Errors, Output> {
    return Sink(
      (a) => sink.event(a).traced(trace),
      (e) => sink.error(e).traced(trace),
      () => sink.end().traced(trace),
    )
  }
}

/**
 * TypeLambda for typeclasses using Fx.
 * @since 1.0.0
 * @category Type Lambda
 */
export interface FxTypeLambda extends TypeLambda {
  readonly type: Fx<this['Out2'], this['Out1'], this['Target']>
}

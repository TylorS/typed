import * as Option from "@effect/data/Option"
import * as Cause from "@effect/io/Cause"
import * as Deferred from "@effect/io/Deferred"
import * as Effect from "@effect/io/Effect"
import * as Context from "@typed/context"

// TODO: Implement Unify + dual

/**
 * The Identifier used in the Effect context to store the SinkService.
 * It is encoded covariantly such that the inference of an push-based stream
 * can be properly inferred.
 */
export interface Sink<out E, out A> {
  readonly _tag: "@typed/fx/Sink"
  readonly _E: (_: never) => E
  readonly _A: (_: never) => A
}

/**
 * The SinkService is used to push values and errors into a Sink. The must not
 * have any resources or fail.
 */
export interface SinkService<in E, in A> {
  readonly _tag: string
  onFailure(e: Cause.Cause<E>): Effect.Effect<never, never, unknown>
  onSuccess(a: A): Effect.Effect<never, never, unknown>
}

export interface SinkTag<E, A> extends Context.Tag<Sink<E, A>, SinkService<E, A>> {
  readonly event: (value: A) => Effect.Effect<Sink<E, A>, never, unknown>
  readonly events: <const B extends ReadonlyArray<A>>(values: B) => Effect.Effect<Sink<E, B[number]>, never, void>
  readonly failCause: (error: Cause.Cause<E>) => Effect.Effect<Sink<E, A>, never, unknown>
  readonly fail: (error: E) => Effect.Effect<Sink<E, A>, never, unknown>
}

const sinkTag: SinkTag<any, any> = Object.assign(Context.Tag<Sink<any, any>, SinkService<any, any>>("@typed/fx/Sink"), {
  event,
  events,
  failCause,
  fail
})

/**
 * Get a Sink from the Effect context.
 */
export function Sink<E, A>(): SinkTag<E, A> {
  return sinkTag as any
}

export namespace Sink {
  /**
   * Extract the Error types from a Sink
   */
  export type Error<T> = [T] extends [never] ? never : T extends Sink<infer E, infer _> ? E : never

  /**
   * Extract the Event types from a Sink
   */
  export type Event<T> = [T] extends [never] ? never : T extends Sink<infer _, infer A> ? A : never
}

/**
 * Construct a SinkService.
 */
export function SinkService<E, A>(
  tag: string,
  onFailure: (e: Cause.Cause<E>) => Effect.Effect<never, never, unknown>,
  onSuccess: (a: A) => Effect.Effect<never, never, unknown>
): SinkService<E, A> {
  return {
    _tag: tag,
    onFailure,
    onSuccess
  }
}

/**
 * A SinkService that permits some context R to be required. Useful for constructing
 * operators that require some context.
 */
export type WithContext<R, E, A> = {
  readonly _tag: string
  onFailure: (e: Cause.Cause<E>) => Effect.Effect<R, never, unknown>
  onSuccess: (a: A) => Effect.Effect<R, never, unknown>
}

/**
 * Construct a SinkService that requires some context R.
 */
export function WithContext<E, R, A, R2>(
  tag: string,
  onFailure: (e: Cause.Cause<E>) => Effect.Effect<R, never, unknown>,
  onSuccess: (a: A) => Effect.Effect<R2, never, unknown>
): WithContext<R | R2, E, A> {
  return {
    _tag: tag,
    onFailure,
    onSuccess
  }
}

/**
 * Perform an Effect to compute an new Cause to fail with.
 */
export function mapErrorCause<R, E, E2, A, E3, R2>(
  sink: WithContext<R, E | E2, A>,
  f: (cause: Cause.Cause<E3>) => Effect.Effect<R2, E, Cause.Cause<E2>>
): WithContext<R | R2, E3, A> {
  return WithContext(
    "MapErrorCause",
    (cause) =>
      f(cause).pipe(Effect.matchCauseEffect({
        onFailure: sink.onFailure,
        onSuccess: sink.onFailure
      })),
    sink.onSuccess
  )
}

/**
 * Perform an Effect to compute an new Error to fail with.
 */
export function mapError<R, E, A, R2, E2, B>(
  sink: WithContext<R, E2 | B, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>
): WithContext<R | R2, E, A> {
  return mapErrorCause(sink, (cause) =>
    Cause.failureOption(cause).pipe(
      Option.match({
        onNone: () => Effect.succeed(cause as Cause.Cause<never>),
        onSome: (e) => Effect.map(f(e), Cause.fail)
      })
    ))
}

/**
 * Perform an Effect to compute a new value to succeed with.
 */
export function map<R, E, A, R2, E2, B>(
  sink: WithContext<R, E | E2, B>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): WithContext<R | R2, E, A> {
  return WithContext(
    "Map",
    sink.onFailure,
    (a) => Effect.matchCauseEffect(f(a), sink)
  )
}

/**
 * Perform an Effect with the emitted value.
 */
export function tap<R, E, A, R2, E2, B>(
  sink: WithContext<R, E | E2, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): WithContext<R | R2, E, A> {
  return WithContext(
    "Tap",
    sink.onFailure,
    (a) =>
      Effect.matchCauseEffect(f(a), {
        onFailure: sink.onFailure,
        onSuccess: () => sink.onSuccess(a)
      })
  )
}

/**
 * Deal with failure and success cases separately.
 */
export function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  sink: WithContext<R, E2 | E3, B | C>,
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  onSuccess: (a: A) => Effect.Effect<R3, E3, C>
): WithContext<R | R2 | R3, E, A> {
  return WithContext(
    "MatchCause",
    (cause) => Effect.matchCauseEffect(onFailure(cause), sink),
    (value) => Effect.matchCauseEffect(onSuccess(value), sink)
  )
}

/**
 * Provide a SinkService with some context.
 */
export function provideContext<R, E, A>(
  sink: WithContext<R, E, A>,
  context: Context.Context<R>
): SinkService<E, A> {
  return SinkService(
    sink._tag,
    (cause) => Effect.provideContext(sink.onFailure(cause), context),
    (a) => Effect.provideContext(sink.onSuccess(a), context)
  )
}

export function event<A>(value: A) {
  return Sink<never, A>().withEffect((sink) => sink.onSuccess(value))
}

export function events<const A extends ReadonlyArray<any>>(
  values: A
): Effect.Effect<Sink<never, A[number]>, never, void> {
  return Sink<never, A>().withEffect((sink) => Effect.forEach(values, (a) => sink.onSuccess(a), { discard: true }))
}

export function failCause<E>(error: Cause.Cause<E>) {
  return Sink<E, never>().withEffect((sink) => sink.onFailure(error))
}

export function fail<E>(error: E) {
  return failCause(Cause.fail(error))
}

export interface DeferredSinkService<E, A, B> extends SinkService<E, A> {
  provide<R, E2>(
    this: DeferredSinkService<E, A, B>,
    effect: Effect.Effect<R, E2, B>
  ): Effect.Effect<Exclude<R, Sink<E, A>>, E2, B>

  wait(): Effect.Effect<never, E, B>
}

export function runDeferredSink<R, E, A, E2, A2>(
  effect: Effect.Effect<R, E, A>,
  service: DeferredSinkService<E2, A2, A>
): Effect.Effect<Exclude<R, Sink<E2, A2>>, E | E2, A> {
  return Effect.flatMap(service.provide(effect), () => service.wait())
}

class Observe<E, A, B> implements DeferredSinkService<E, A, B> {
  readonly _tag = "Observe" as const

  constructor(
    readonly deferred: Deferred.Deferred<E, B>,
    private _onSuccess: (value: A) => Effect.Effect<never, E, unknown>
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<never, never, void> {
    return Deferred.failCause(this.deferred, cause)
  }

  onSuccess(a: A): Effect.Effect<never, never, void> {
    return this._onSuccess(a).pipe(Effect.catchAllCause((cause) => this.onFailure(cause)))
  }

  provide<R, E2>(
    effect: Effect.Effect<R, E2, B>
  ): Effect.Effect<Exclude<R, Sink<E, A>>, E2, B> {
    return effect.pipe(
      // Signal that we are done
      Effect.tap((a) => Deferred.succeed(this.deferred, a)),
      Sink<E, A>().provide(this)
    )
  }

  wait(): Effect.Effect<never, E, B> {
    return Deferred.await(this.deferred)
  }
}

export function makeObserve<R, E, A, E2 = never, B = unknown>(
  f: (value: A) => Effect.Effect<R, E, unknown>
): Effect.Effect<R, never, Observe<E | E2, A, B>> {
  return Effect.contextWithEffect((ctx) =>
    Effect.map(
      Deferred.make<E, B>(),
      (deferred) => new Observe<E | E2, A, B>(deferred, (a) => Effect.provideContext(f(a), ctx))
    )
  )
}

const constUnit = () => Effect.unit

export function makeDrain<E, A, B>(): Effect.Effect<never, never, Observe<E, A, B>> {
  return Effect.map(
    Deferred.make<E, B>(),
    (deferred) => new Observe<E, A, B>(deferred, constUnit)
  )
}

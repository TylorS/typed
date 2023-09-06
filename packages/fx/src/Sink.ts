import * as Option from "@effect/data/Option"
import * as Cause from "@effect/io/Cause"
import * as Deferred from "@effect/io/Deferred"
import * as Effect from "@effect/io/Effect"
import * as Context from "@typed/context"

// TODO: Implement Unify + dual

export interface Sink<out E, out A> {
  readonly _tag: "@typed/fx/Sink"
  readonly _E: (_: never) => E
  readonly _A: (_: never) => A
}

export interface SinkService<in E, in A> {
  readonly _tag: string
  onFailure(e: Cause.Cause<E>): Effect.Effect<never, never, unknown>
  onSuccess(a: A): Effect.Effect<never, never, unknown>
}

const sinkTag = Context.Tag<Sink<any, any>, SinkService<any, any>>("@typed/fx/Sink")

export function Sink<E, A>(): Context.Tag<Sink<E, A>, SinkService<E, A>> {
  return sinkTag as any
}

export namespace Sink {
  export type Error<T> = [T] extends [never] ? never : T extends Sink<infer E, infer _> ? E : never
  export type Event<T> = [T] extends [never] ? never : T extends Sink<infer _, infer A> ? A : never
}

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

export type WithContext<R, E, A> = {
  readonly _tag: string
  onFailure: (e: Cause.Cause<E>) => Effect.Effect<R, never, unknown>
  onSuccess: (a: A) => Effect.Effect<R, never, unknown>
}

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

export function provide<R, E, A>(
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
  return Sink<never, A>().withEffect((sink) => Effect.all(values.map((a) => sink.onSuccess(a)), { discard: true }))
}

export function failCause<E>(error: Cause.Cause<E>) {
  return Sink<E, never>().withEffect((sink) => sink.onFailure(error))
}

export function fail<E>(error: E) {
  return failCause(Cause.fail(error))
}

export class Drain<E, A, B> implements SinkService<E, A> {
  readonly _tag = "Drain" as const

  constructor(readonly deferred: Deferred.Deferred<E, B>) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<never, never, void> {
    return Deferred.failCause(this.deferred, cause)
  }

  onSuccess(): Effect.Effect<never, never, void> {
    return Effect.unit
  }

  provide<R, E2>(
    this: Drain<E, A, B>,
    effect: Effect.Effect<R, E2, B>
  ): Effect.Effect<Exclude<R, Sink<E, A>>, E2, B> {
    return effect.pipe(
      // Signal that we are done
      Effect.tap((b) => Deferred.succeed(this.deferred, b)),
      Sink<E, A>().provide(this)
    )
  }

  wait(): Effect.Effect<never, E, B> {
    return Deferred.await(this.deferred)
  }
}

export function makeDrain<E, A, B>(): Effect.Effect<never, never, Drain<E, A, B>> {
  return Effect.map(
    Deferred.make<E, B>(),
    (deferred) => new Drain<E, A, B>(deferred)
  )
}

export class Observe<E, A, B> implements SinkService<E, A> {
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

  provide<R, E2, A2>(
    this: Observe<E, A, B>,
    effect: Effect.Effect<R, E2, A2>
  ): Effect.Effect<Exclude<R, Sink<E, A>>, E2, A2> {
    return effect.pipe(
      // Signal that we are done
      Effect.tap(() => Deferred.succeed(this.deferred, undefined)),
      Sink<E, A>().provide(this)
    )
  }

  wait(): Effect.Effect<never, E, B> {
    return Deferred.await(this.deferred)
  }
}

export function makeObserve<B>() {
  return <R, E, A, E2 = E>(
    f: (value: A) => Effect.Effect<R, E, unknown>
  ): Effect.Effect<R, never, Observe<E | E2, A, B>> => {
    return Effect.contextWithEffect((ctx) =>
      Effect.map(
        Deferred.make<E, B>(),
        (deferred) => new Observe<E | E2, A, B>(deferred, (a) => Effect.provideContext(f(a), ctx))
      )
    )
  }
}

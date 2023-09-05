import * as Cause from "@effect/io/Cause"
import * as Deferred from "@effect/io/Deferred"
import * as Effect from "@effect/io/Effect"
import * as Context from "@typed/context"

export interface Error<E> {
  readonly _tag: "@typed/fx/Error"
  readonly _E: (_: never) => E
}

export interface ErrorService<E> {
  readonly _tag: string
  onFailure(e: Cause.Cause<E>): Effect.Effect<never, never, void>
}

const errorTag = Context.Tag<Error<any>, ErrorService<any>>("@typed/fx/Error")

export function Error<E>(): Context.Tag<Error<E>, ErrorService<E>> {
  return errorTag as any
}

export interface Event<A> {
  readonly _tag: "@typed/fx/Event"
  readonly _A: (_: never) => A
}

export interface EventService<A> {
  readonly _tag: string
  onSuccess(a: A): Effect.Effect<never, never, void>
}

const eventTag = Context.Tag<Event<any>, EventService<any>>("@typed/fx/Event")

export function Event<A>(): Context.Tag<Event<A>, EventService<A>> {
  return eventTag as any
}

const sink = Context.struct({
  error: errorTag,
  event: eventTag
})

export function Sink<E, A>(): Context.TaggedStruct<{
  readonly error: ReturnType<typeof Error<E>>
  readonly event: ReturnType<typeof Event<A>>
}> {
  return sink as any
}

export type Sink<E, A> = Error<E> | Event<A>

export interface SinkService<E, A> {
  readonly error: ErrorService<E>
  readonly event: EventService<A>
}

export namespace Sink {
  export type Extract<T> = Sink<ExtractError<T>, ExtractEvent<T>>

  export type ExtractError<T> = T extends Error<infer E> ? E : never
  export type ExtractEvent<T> = T extends Event<infer A> ? A : never
}

export class DrainErrorService<E> implements ErrorService<E> {
  readonly _tag = "DrainError" as const

  constructor(readonly deferred: Deferred.Deferred<E, void>) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<never, never, void> {
    return Deferred.failCause(this.deferred, cause)
  }
}

export class DrainEventService<E, A> implements EventService<A> {
  readonly _tag = "DrainEvent" as const

  constructor(readonly deferred: Deferred.Deferred<E, void>) {}

  onSuccess(): Effect.Effect<never, never, void> {
    return Deferred.succeed(this.deferred, undefined)
  }
}

export class Drain<E, A> implements ErrorService<E>, EventService<A> {
  readonly _tag = "Drain" as const

  constructor(readonly deferred: Deferred.Deferred<E, void>) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<never, never, void> {
    return Deferred.failCause(this.deferred, cause)
  }

  onSuccess(): Effect.Effect<never, never, void> {
    return Deferred.succeed(this.deferred, undefined)
  }

  provide<R, E2, A2>(
    this: Drain<E, A>,
    effect: Effect.Effect<R, E2, A2>
  ): Effect.Effect<Exclude<R, Sink<E, A>>, E2, A2> {
    return effect.pipe(Sink<E, A>().provide({ error: this, event: this }))
  }

  wait() {
    return Deferred.await(this.deferred)
  }
}

export function drain<E, A>(): Effect.Effect<never, never, Drain<E, A>> {
  return Effect.map(
    Deferred.make<E, void>(),
    (deferred) => new Drain<E, A>(deferred)
  )
}

export function event<A>(value: A) {
  return Effect.flatMap(Event<A>(), (f) => f.onSuccess(value))
}

export function failCause<E>(error: Cause.Cause<E>) {
  return Effect.flatMap(Error<E>(), (f) => f.onFailure(error))
}

export function fail<E>(error: E) {
  return failCause(Cause.fail(error))
}

export class MapEventService<A, B> implements EventService<A> {
  readonly _tag = "MapEvent" as const

  constructor(readonly service: EventService<B>, readonly f: (a: A) => B) {}

  onSuccess(a: A): Effect.Effect<never, never, void> {
    return this.service.onSuccess(this.f(a))
  }

  static make<A, B>(service: EventService<B>, f: (a: A) => B): EventService<A> {
    if (isMapEventService(service)) {
      return new MapEventService(service.service, (a) => service.f(f(a)))
    } else {
      return new MapEventService(service, f)
    }
  }
}

function isMapEventService<A>(service: EventService<A>): service is MapEventService<A, any> {
  return service._tag === "MapEvent"
}

export function map<R, E, A, B, C>(
  effect: Effect.Effect<R | Event<B>, E, A>,
  f: (b: B) => C
): Effect.Effect<Exclude<R, Event<B>> | Event<C>, E, A> {
  return Effect.flatMap(
    Event<C>(),
    (event) => Effect.provideService(effect, Event<B>(), MapEventService.make(event, f))
  )
}

export class MapEffectEventService<A, E, B> implements EventService<A> {
  readonly _tag = "MapEffectEvent" as const

  constructor(
    readonly eventService: EventService<B>,
    readonly errorService: ErrorService<E>,
    readonly f: (a: A) => Effect.Effect<never, E, B>
  ) {}

  onSuccess(a: A): Effect.Effect<never, never, void> {
    return Effect.matchCauseEffect(this.f(a), {
      onSuccess: (b) => this.eventService.onSuccess(b),
      onFailure: (cause) => this.errorService.onFailure(cause)
    })
  }

  static make<A, E, B>(
    sink: SinkService<E, B>,
    f: (a: A) => Effect.Effect<never, E, B>
  ): EventService<A> {
    if (isMapEventService(sink.event)) {
      return new MapEffectEventService(
        sink.event.service,
        sink.error,
        (a) =>
          Effect.matchCauseEffect(f(a), {
            onFailure: sink.error.onFailure,
            onSuccess: sink.event.onSuccess
          })
      )
    }

    return new MapEffectEventService(sink.event, sink.error, f)
  }
}

export function mapEffect<R, E, A, R2, E2, B>(
  effect: Effect.Effect<R | Event<A>, E, unknown>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R2 | Exclude<R, Event<A>> | Event<B> | Error<E | E2>, never, unknown> {
  return Effect.flatMap(
    Effect.zip(Sink<E | E2, B>(), Effect.context<R2>()),
    ([sink, ctx]) =>
      Effect.catchAllCause(
        Effect.provideService(
          effect,
          Event<A>(),
          MapEffectEventService.make(sink, (a) => Effect.provideSomeContext(f(a), ctx))
        ),
        sink.error.onFailure
      )
  )
}

export class MapErrorCauseService<A, B> implements ErrorService<A> {
  readonly _tag = "MapErrorCause" as const

  constructor(readonly service: ErrorService<B>, readonly f: (b: Cause.Cause<A>) => Cause.Cause<B>) {}

  onFailure(cause: Cause.Cause<A>): Effect.Effect<never, never, void> {
    return this.service.onFailure(this.f(cause))
  }

  static make<A, B>(
    service: ErrorService<B>,
    f: (b: Cause.Cause<A>) => Cause.Cause<B>
  ): ErrorService<A> {
    if (isMapErrorCauseService(service)) {
      return new MapErrorCauseService(service.service, (a) => service.f(f(a)))
    } else {
      return new MapErrorCauseService(service, f)
    }
  }
}

function isMapErrorCauseService<A>(service: ErrorService<A>): service is MapErrorCauseService<A, any> {
  return service._tag === "MapErrorCause"
}

export function mapErrorCause<R, E, A, B, C>(
  effect: Effect.Effect<R | Error<B>, E, A>,
  f: (b: Cause.Cause<B>) => Cause.Cause<C>
): Effect.Effect<Exclude<R, Error<B>> | Error<C>, E, A> {
  return Effect.flatMap(
    Error<C>(),
    (event) => Effect.provideService(effect, Error<B>(), MapErrorCauseService.make(event, f))
  )
}

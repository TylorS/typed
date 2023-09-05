import * as Context from "@effect/data/Context"
import * as Cause from "@effect/io/Cause"
import * as Deferred from "@effect/io/Deferred"
import * as Effect from "@effect/io/Effect"

export interface Error<E> {
  readonly _tag: "SinkError"
  readonly _E: (_: never) => E
}

export interface ErrorService<E> {
  readonly _tag: string
  error(e: Cause.Cause<E>): Effect.Effect<never, never, void>
}

const errorTag = Context.Tag<Error<any>, ErrorService<any>>("@typed/fx/Error")

export function Error<E>(): Context.Tag<Error<E>, ErrorService<E>> {
  return errorTag as any
}

export function provideError<R, E, A, E2>(
  effect: Effect.Effect<R, E, A>,
  service: ErrorService<E>
): Effect.Effect<Exclude<R, Error<E2>>, E, A> {
  return Effect.provideService(effect, errorTag, service)
}

export interface Event<A> {
  readonly _tag: "SinkEvent"
  readonly _A: (_: never) => A
}

export interface EventService<A> {
  readonly _tag: string
  event(a: A): Effect.Effect<never, never, void>
}

const eventTag = Context.Tag<Event<any>, EventService<any>>("@typed/fx/Event")

export function Event<A>(): Context.Tag<Event<A>, EventService<A>> {
  return eventTag as any
}

export function provideEvent<R, E, A, A2>(
  effect: Effect.Effect<R, E, A>,
  service: EventService<A>
): Effect.Effect<Exclude<R, Event<A2>>, E, A> {
  return Effect.provideService(effect, eventTag, service)
}

export type Sink<E, A> = Error<E> | Event<A>

export interface SinkService<E, A> {
  readonly onFailure: ErrorService<E>["error"]
  readonly onSuccess: EventService<A>["event"]
}

export function Sink<E, A>(): Effect.Effect<Error<E> | Event<A>, never, SinkService<E, A>> {
  return (
    Effect.zipWith(
      Error<E>(),
      Event<A>(),
      (error, event) => ({ onFailure: (cause) => error.error(cause), onSuccess: (value) => event.event(value) })
    )
  )
}

export namespace Sink {
  export type Extract<T> = Sink<ExtractError<T>, ExtractEvent<T>>

  export type ExtractError<T> = T extends Error<infer E> ? E : never
  export type ExtractEvent<T> = T extends Event<infer A> ? A : never
}

export function makeSinkContext<E2, A2>(
  error: ErrorService<E2>,
  event: EventService<A2>
): Context.Context<Sink<E2, A2>> {
  return Context.add(Context.make(errorTag, error), eventTag, event)
}

export class DrainErrorService<E> implements ErrorService<E> {
  readonly _tag = "DrainError" as const

  constructor(readonly deferred: Deferred.Deferred<E, void>) {}

  error(cause: Cause.Cause<E>): Effect.Effect<never, never, void> {
    return Deferred.failCause(this.deferred, cause)
  }
}

export class DrainEventService<E, A> implements EventService<A> {
  readonly _tag = "DrainEvent" as const

  constructor(readonly deferred: Deferred.Deferred<E, void>) {}

  event(): Effect.Effect<never, never, void> {
    return Deferred.succeed(this.deferred, undefined)
  }
}

export function drain<E, A>() {
  return Effect.map(
    Deferred.make<E, void>(),
    (deferred) => ({
      deferred,
      sink: makeSinkContext<E, A>(
        new DrainErrorService(deferred),
        new DrainEventService(deferred)
      )
    } as const)
  )
}

export function event<A>(value: A) {
  return Effect.flatMap(Event<A>(), (f) => f.event(value))
}

export function failCause<E>(error: Cause.Cause<E>) {
  return Effect.flatMap(Error<E>(), (f) => f.error(error))
}

export function fail<E>(error: E) {
  return failCause(Cause.fail(error))
}

export class MapEventService<A, B> implements EventService<A> {
  readonly _tag = "MapEvent" as const

  constructor(readonly service: EventService<B>, readonly f: (a: A) => B) {}

  event(a: A): Effect.Effect<never, never, void> {
    return this.service.event(this.f(a))
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

export class MapErrorCauseService<A, B> implements ErrorService<A> {
  readonly _tag = "MapErrorCause" as const

  constructor(readonly service: ErrorService<B>, readonly f: (b: Cause.Cause<A>) => Cause.Cause<B>) {}

  error(cause: Cause.Cause<A>): Effect.Effect<never, never, void> {
    return this.service.error(this.f(cause))
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

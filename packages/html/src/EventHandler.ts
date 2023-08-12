import * as Effect from '@effect/io/Effect'

import type { Placeholder } from './Placeholder.js'

export interface EventHandler<T extends Event, R = never, E = never>
  extends Placeholder<R, E, void> {
  readonly handler: (event: T) => Effect.Effect<R, E, void>
  readonly options?: boolean | AddEventListenerOptions
}

export function EventHandler<T extends Event, R = never, E = never>(
  handler: (event: T) => Effect.Effect<R, E, void>,
  options?: boolean | AddEventListenerOptions,
): EventHandler<T, R, E> {
  return new EventHandlerImplementation<T, R, E>(handler, options)
}

export namespace EventHandler {
  export function preventDefault<T extends Event, R = never, E = never>(
    handler: (event: T) => Effect.Effect<R, E, void>,
    options?: boolean | AddEventListenerOptions,
  ): EventHandler<T, R, E> {
    return EventHandler((event) => (event.preventDefault(), handler(event)), options)
  }

  preventDefault.if = <T extends Event, R = never, E = never>(
    predicate: (event: T) => boolean,
    handler: (event: T) => Effect.Effect<R, E, void>,
    options?: boolean | AddEventListenerOptions,
  ) =>
    EventHandler(
      (event: T) => (predicate(event) ? (event.preventDefault(), handler(event)) : Effect.unit),
      options,
    )

  export function stopPropagation<T extends Event, R = never, E = never>(
    handler: (event: T) => Effect.Effect<R, E, void>,
    options?: boolean | AddEventListenerOptions,
  ): EventHandler<T, R, E> {
    return EventHandler((event) => (event.stopPropagation(), handler(event)), options)
  }

  export function target<T extends HTMLElement, Ev extends Event = Event>() {
    return <R = never, E = never>(
      handler: (event: Ev & { target: T }) => Effect.Effect<R, E, void>,
      options?: boolean | AddEventListenerOptions,
    ): EventHandler<Ev & { target: T }, R, E> => EventHandler(handler, options)
  }
}

/**
 * @internal
 */
export class EventHandlerImplementation<T extends Event, R = never, E = never>
  implements EventHandler<T, R, E>
{
  readonly __Placeholder__!: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => void
  }

  constructor(
    readonly handler: (event: T) => Effect.Effect<R, E, void>,
    readonly options?: boolean | AddEventListenerOptions,
  ) {}
}

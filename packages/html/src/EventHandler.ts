import type { Effect } from '@effect/io/Effect'

import type { Placeholder } from './Placeholder.js'

export interface EventHandler<T extends Event, R = never, E = never>
  extends Placeholder<R, E, void> {
  readonly handler: (event: T) => Effect<R, E, void>
  readonly options?: boolean | AddEventListenerOptions
}

export function EventHandler<T extends Event, R = never, E = never>(
  handler: (event: T) => Effect<R, E, void>,
  options?: boolean | AddEventListenerOptions,
): EventHandler<T, R, E> {
  return new EventHandlerImplementation<T, R, E>(handler, options)
}

export namespace EventHandler {
  export function preventDefault<T extends Event, R = never, E = never>(
    handler: (event: T) => Effect<R, E, void>,
    options?: boolean | AddEventListenerOptions,
  ): EventHandler<T, R, E> {
    return EventHandler((event) => (event.preventDefault(), handler(event)), options)
  }

  export function stopPropagation<T extends Event, R = never, E = never>(
    handler: (event: T) => Effect<R, E, void>,
    options?: boolean | AddEventListenerOptions,
  ): EventHandler<T, R, E> {
    return EventHandler((event) => (event.stopPropagation(), handler(event)), options)
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
    readonly handler: (event: T) => Effect<R, E, void>,
    readonly options?: boolean | AddEventListenerOptions,
  ) {}
}

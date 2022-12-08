import { Effect } from '@effect/core/io/Effect'

import { Placeholder } from './Placeholder.js'

export interface EventHandler<T extends Event, R = never> extends Placeholder<R> {
  readonly handler: (event: T) => Effect<R, never, void>
  readonly options?: boolean | AddEventListenerOptions
}

export function EventHandler<T extends Event, R = never>(
  handler: (event: T) => Effect<R, never, void>,
  options?: boolean | AddEventListenerOptions,
): EventHandler<T, R> {
  return new EventHandlerImplementation<T, R>(handler, options)
}

export namespace EventHandler {
  export function preventDefault<T extends Event, R = never>(
    handler: (event: T) => Effect<R, never, void>,
    options?: boolean | AddEventListenerOptions,
  ): EventHandler<T, R> {
    return EventHandler((event) => (event.preventDefault(), handler(event)), options)
  }

  export function stopPropagation<T extends Event, R = never>(
    handler: (event: T) => Effect<R, never, void>,
    options?: boolean | AddEventListenerOptions,
  ): EventHandler<T, R> {
    return EventHandler((event) => (event.stopPropagation(), handler(event)), options)
  }
}

export class EventHandlerImplementation<T extends Event, R = never> implements EventHandler<T, R> {
  readonly __Placeholder__!: {
    readonly _R: (_: never) => R
  }

  constructor(
    readonly handler: (event: T) => Effect<R, never, void>,
    readonly options?: boolean | AddEventListenerOptions,
  ) {}
}
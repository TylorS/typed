import { Effect } from '@effect/core/io/Effect'

import { Placeholder } from './Placeholder.js'

export interface EventHandler<T extends Event, R = never> extends Placeholder<R> {
  readonly handler: (event: T) => Effect<R, never, void>
  readonly options?: boolean | EventListenerOptions
}

export function EventHandler<T extends Event, R = never>(
  handler: (event: T) => Effect<R, never, void>,
  options?: boolean | EventListenerOptions,
): EventHandler<T, R> {
  return new EventHandlerImplementation<T, R>(handler, options)
}

export class EventHandlerImplementation<T extends Event, R = never> implements EventHandler<T, R> {
  readonly _R!: (_: never) => R

  constructor(
    readonly handler: (event: T) => Effect<R, never, void>,
    readonly options?: boolean | EventListenerOptions,
  ) {}
}

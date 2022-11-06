import { Effect } from '@effect/core/io/Effect'

import { Placeholder } from './Placeholder.js'

export interface EventHandler<T extends Event, R = never> extends Placeholder<R> {
  readonly handler: (event: T) => Effect<R, never, void>
  readonly options?: boolean | EventListenerOptions
}

export function EventHandler(
  handler: (event: Event) => Effect<never, never, void>,
  options?: boolean | EventListenerOptions,
): EventHandler<Event, never> {
  return new EventHandlerImplementation(handler, options)
}

export class EventHandlerImplementation<T extends Event, R = never> implements EventHandler<T, R> {
  readonly _R!: (_: never) => R

  constructor(
    readonly handler: (event: T) => Effect<R, never, void>,
    readonly options?: boolean | EventListenerOptions,
  ) {}
}

import { Effect } from '@effect/core/io/Effect'

import { Placeholder } from './Placeholder.js'

export class EventHandler<T extends Event, R = never> implements Placeholder<R> {
  readonly _R!: (_: never) => R

  constructor(
    readonly handler: (event: T) => Effect<R, never, void>,
    readonly options?: boolean | EventListenerOptions,
  ) {}
}

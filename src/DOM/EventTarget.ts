import * as Effect from '@effect/core/io/Effect'
import * as Fx from '@typed/fx'

import type { DefaultEventMap } from './DomSource.js'

// TODO: dispatchEvent primitives
// TODO: Can we use custom events to communicate between components usefully?

export function addEventListener<T extends EventTarget, EventName extends keyof DefaultEventMap<T>>(
  event: EventName,
  options?: AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, DefaultEventMap<T>[EventName]>

export function addEventListener<T extends EventTarget, EventName extends string>(
  event: EventName,
  options?: AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, Event> {
  return (target: T): Fx.Fx<never, never, Event> =>
    Fx.withEmitter(({ unsafeEmit }) =>
      Effect.sync(addEventListener_(target, event, unsafeEmit, options)),
    )
}

function addEventListener_(
  target: EventTarget,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
): () => void {
  target.addEventListener(event, listener, options)

  return () => {
    target.removeEventListener(event, listener, options)
  }
}

export function preventDefault<R, E, A extends Event>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.tap((event: A) => event.preventDefault())(fx)
}

export function stopPropagation<R, E, A extends Event>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.tap((event: A) => event.stopPropagation())(fx)
}

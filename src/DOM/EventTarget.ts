import * as Effect from '@effect/core/io/Effect'
import * as Fx from '@typed/fx'

import type { DefaultEventMap } from './DomSource.js'
import { withEmitter } from './withEmitter.js'

export function addEventListener<T extends EventTarget, EventName extends keyof DefaultEventMap<T>>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, DefaultEventMap<T>[EventName]>

export function addEventListener<T extends EventTarget, EventName extends string>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, Event> {
  return (target: T): Fx.Fx<never, never, Event> =>
    withEmitter(({ unsafeEmit }) =>
      Effect.sync(addEventListener_(target, event, unsafeEmit, options)),
    )
}

function addEventListener_(
  target: EventTarget,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
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

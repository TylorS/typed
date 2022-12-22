import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

import { GlobalThis } from './GlobalThis.js'
import type { DefaultEventMap } from './helpers.js'

// TODO: dispatchEvent primitives
// TODO: Can we use custom events to communicate between components usefully? Maybe integrate with fp-ts/schema?

export function addEventListener<T extends EventTarget, EventName extends keyof DefaultEventMap<T>>(
  event: EventName,
  options?: AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, DefaultEventMap<T>[EventName]>

export function addEventListener<T extends EventTarget, EventName extends string>(
  event: EventName,
  options?: AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, Event> {
  return (target: T): Fx.Fx<never, never, Event> =>
    Fx.fromEmitter(({ emit }) => {
      const cleanup = addEventListener_(target, event, emit, options)

      return Effect.addFinalizer(() => Effect.sync(cleanup))
    })
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
  return Fx.tap((event: A) => Effect.succeed(event.preventDefault()))(fx)
}

export function stopPropagation<R, E, A extends Event>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.tap((event: A) => Effect.succeed(event.stopPropagation()))(fx)
}

export function dispatchEventWith<
  T extends EventTarget,
  EventName extends keyof DefaultEventMap<T>,
>(event: EventName, options?: EventInit): (target: T) => Effect.Effect<GlobalThis, never, boolean> {
  return (target) =>
    GlobalThis.access((globalThis) =>
      target.dispatchEvent(new globalThis.Event(event as string, options)),
    )
}

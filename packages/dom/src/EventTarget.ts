import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

import { GlobalThis } from './GlobalThis.js'
import type { DefaultEventMap } from './helpers.js'

// TODO: dispatchEvent primitives
// TODO: Can we use custom events to communicate between components usefully? Maybe integrate with fp-ts/schema?

export function addEventListener<T extends EventTarget, EventName extends keyof DefaultEventMap<T>>(
  event: EventName,
  options?: AddEventListenerOptions | boolean,
): (target: T) => Fx.Fx<never, never, DefaultEventMap<T>[EventName]>

export function addEventListener<T extends EventTarget, EventName extends string>(
  eventName: EventName,
  options?: AddEventListenerOptions | boolean,
): (target: T) => Fx.Fx<never, never, Event>

export function addEventListener<T extends EventTarget, EventName extends string>(
  eventName: EventName,
  options?: AddEventListenerOptions | boolean,
): (target: T) => Fx.Fx<never, never, Event> {
  return (target: T): Fx.Fx<never, never, Event> =>
    Fx.fromEmitter(({ event }) => {
      const cleanup = addEventListener_(target, eventName, event, options)

      return Effect.addFinalizer(() => Effect.sync(cleanup))
    })
}

function addEventListener_(
  target: EventTarget,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | boolean,
): () => void {
  target.addEventListener(event, listener, options)

  return () => {
    target.removeEventListener(event, listener, options)
  }
}

export function preventDefault<R, E, A extends Event>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.tap(fx, (event: A) => Effect.succeed(event.preventDefault()))
}

export function stopPropagation<R, E, A extends Event>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.tap(fx, (event: A) => Effect.succeed(event.stopPropagation()))
}

export function dispatchEventWith<
  T extends EventTarget,
  EventName extends keyof DefaultEventMap<T>,
>(event: EventName, options?: EventInit): (target: T) => Effect.Effect<GlobalThis, never, boolean> {
  return (target) =>
    GlobalThis.with((globalThis) =>
      target.dispatchEvent(new globalThis.Event(event as string, options)),
    )
}

export function getIsUsingKeyModifier(event: KeyboardEvent | MouseEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
}

export type EventWithTarget<T extends HTMLElement> = Event & { target: T }

export type EventWithCurrentTarget<T extends HTMLElement> = Event & { currentTarget: T }

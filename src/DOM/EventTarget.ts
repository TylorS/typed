import { sync } from '@effect/core/io/Effect'
import * as Fx from '@typed/fx'

export function addEventListener<T extends Document, EventName extends keyof DocumentEventMap>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, DocumentEventMap[EventName]>

export function addEventListener<T extends Window, EventName extends keyof WindowEventMap>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, WindowEventMap[EventName]>

export function addEventListener<
  T extends HTMLElement,
  EventName extends keyof HTMLElementEventMap,
>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, HTMLElementEventMap[EventName]>

export function addEventListener<T extends Element, EventName extends keyof ElementEventMap>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, ElementEventMap[EventName]>

export function addEventListener<T extends EventTarget, EventName extends string>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, Event>

export function addEventListener<T extends EventTarget, EventName extends string>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
): (target: T) => Fx.Fx<never, never, Event> {
  return (target: T): Fx.Fx<never, never, Event> =>
    Fx.withEmitter(({ unsafeEmit }) => sync(addEventListener_(target, event, unsafeEmit, options)))
}

function addEventListener_(
  target: EventTarget,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): () => void {
  target.addEventListener(event, listener, options)

  return () => target.removeEventListener(event, listener, options)
}

export function preventDefault<R, E, A extends Event>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.tap((event: A) => event.preventDefault())(fx)
}

export function stopPropagation<R, E, A extends Event>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.tap((event: A) => event.stopPropagation())(fx)
}

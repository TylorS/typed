import { type EventWithTarget, isUsingKeyModifier } from "@typed/dom/EventTarget"
import type { Placeholder } from "@typed/template/Placeholder"
import { type Effect, unit } from "effect/Effect"

export const EventHandlerTypeId = Symbol.for("@typed/template/EventHandler")
export type EventHandlerTypeId = typeof EventHandlerTypeId

export interface EventHandler<R, E, Ev extends Event = Event> extends Placeholder<R, E, null> {
  readonly [EventHandlerTypeId]: EventHandlerTypeId
  readonly handler: (event: Ev) => Effect<R, E, unknown>
  readonly options: AddEventListenerOptions | undefined
}

export type Context<T> = T extends EventHandler<infer R, infer _E, infer _Ev> ? R : never
export type Error<T> = T extends EventHandler<infer _R, infer E, infer _Ev> ? E : never
export type EventOf<T> = T extends EventHandler<infer _R, infer _E, infer Ev> ? Ev : never

export function make<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev> {
  return {
    [EventHandlerTypeId]: EventHandlerTypeId,
    handler,
    options
  } as any
}

export function preventDefault<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev> {
  return make((ev) => (ev.preventDefault(), handler(ev)), options)
}

export function stopPropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev> {
  return make((ev) => (ev.stopPropagation(), handler(ev)), options)
}

export function stopImmediatePropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev> {
  return make((ev) => (ev.stopImmediatePropagation(), handler(ev)), options)
}

export function target<T extends HTMLElement>() {
  return <R, E, Ev extends Event>(
    handler: (event: EventWithTarget<T, Ev>) => Effect<R, E, unknown>,
    options?: AddEventListenerOptions
  ): EventHandler<R, E, EventWithTarget<T, Ev>> => {
    return make(handler, options)
  }
}

export function keys<Keys extends ReadonlyArray<string>>(...keys: Keys) {
  return <R, E>(
    handler: (event: KeyboardEvent & { key: Keys[number] }) => Effect<R, E, unknown>,
    options?: AddEventListenerOptions
  ): EventHandler<R, E, KeyboardEvent> =>
    make((ev: KeyboardEvent) => !isUsingKeyModifier(ev) && keys.includes(ev.key) ? handler(ev as any) : unit, options)
}

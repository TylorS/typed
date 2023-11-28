/**
 * @since 1.0.0
 */
import { type EventWithTarget, isUsingKeyModifier } from "@typed/dom/EventTarget"
import { type Effect, unit } from "effect/Effect"
import type { Placeholder } from "./Placeholder.js"

/**
 * @since 1.0.0
 */
export const EventHandlerTypeId = Symbol.for("./EventHandler.js")
/**
 * @since 1.0.0
 */
export type EventHandlerTypeId = typeof EventHandlerTypeId

/**
 * @since 1.0.0
 */
export interface EventHandler<R, E, Ev extends Event = Event> extends Placeholder<R, E, null> {
  readonly [EventHandlerTypeId]: EventHandlerTypeId
  readonly handler: (event: Ev) => Effect<R, E, unknown>
  readonly options: AddEventListenerOptions | undefined
}

/**
 * @since 1.0.0
 */
export type Context<T> = T extends EventHandler<infer R, infer _E, infer _Ev> ? R : never
/**
 * @since 1.0.0
 */
export type Error<T> = T extends EventHandler<infer _R, infer E, infer _Ev> ? E : never
/**
 * @since 1.0.0
 */
export type EventOf<T> = T extends EventHandler<infer _R, infer _E, infer Ev> ? Ev : never

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export function preventDefault<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev> {
  return make((ev) => (ev.preventDefault(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export function stopPropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev> {
  return make((ev) => (ev.stopPropagation(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export function stopImmediatePropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev> {
  return make((ev) => (ev.stopImmediatePropagation(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export function target<T extends HTMLElement>() {
  return <R, E, Ev extends Event>(
    handler: (event: EventWithTarget<T, Ev>) => Effect<R, E, unknown>,
    options?: AddEventListenerOptions
  ): EventHandler<R, E, EventWithTarget<T, Ev>> => {
    return make(handler, options)
  }
}

/**
 * @since 1.0.0
 */
export function keys<Keys extends ReadonlyArray<string>>(...keys: Keys) {
  return <R, E>(
    handler: (event: KeyboardEvent & { key: Keys[number] }) => Effect<R, E, unknown>,
    options?: AddEventListenerOptions
  ): EventHandler<R, E, KeyboardEvent> =>
    make((ev: KeyboardEvent) => !isUsingKeyModifier(ev) && keys.includes(ev.key) ? handler(ev as any) : unit, options)
}

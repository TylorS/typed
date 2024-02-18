/**
 * @since 1.0.0
 */
import { type EventWithTarget, isUsingKeyModifier } from "@typed/dom/EventTarget"
import { type Effect, unit } from "effect/Effect"
import type { Placeholder } from "./Placeholder.js"

/**
 * @since 1.0.0
 */
export const EventHandlerTypeId = Symbol.for("@typed/template/EventHandler")
/**
 * @since 1.0.0
 */
export type EventHandlerTypeId = typeof EventHandlerTypeId

/**
 * @since 1.0.0
 */
export interface EventHandler<Ev extends Event = Event, E = never, R = never> extends Placeholder<never, E, R> {
  readonly [EventHandlerTypeId]: EventHandlerTypeId
  readonly handler: (event: Ev) => Effect<unknown, E, R>
  readonly options: AddEventListenerOptions | undefined
}

/**
 * @since 1.0.0
 */
export type Context<T> = T extends EventHandler<infer _Ev, infer _E, infer R> ? R : never
/**
 * @since 1.0.0
 */
export type Error<T> = T extends EventHandler<infer _Ev, infer E, infer _R> ? E : never
/**
 * @since 1.0.0
 */
export type EventOf<T> = T extends EventHandler<infer Ev, infer _E, infer _R> ? Ev : never

/**
 * @since 1.0.0
 */
export function make<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R> {
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
  handler: (event: Ev) => Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R> {
  return make((ev) => (ev.preventDefault(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export function stopPropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R> {
  return make((ev) => (ev.stopPropagation(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export function stopImmediatePropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R> {
  return make((ev) => (ev.stopImmediatePropagation(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export function target<T extends HTMLElement>() {
  return <R, E, Ev extends Event>(
    handler: (event: EventWithTarget<T, Ev>) => Effect<unknown, E, R>,
    options?: AddEventListenerOptions
  ): EventHandler<EventWithTarget<T, Ev>, E, R> => {
    return make(handler, options)
  }
}

/**
 * @since 1.0.0
 */
export function keys<Keys extends ReadonlyArray<string>>(...keys: Keys) {
  return <E, R>(
    handler: (event: KeyboardEvent & { key: Keys[number] }) => Effect<unknown, E, R>,
    options?: AddEventListenerOptions
  ): EventHandler<KeyboardEvent, E, R> =>
    make((ev: KeyboardEvent) => !isUsingKeyModifier(ev) && keys.includes(ev.key) ? handler(ev as any) : unit, options)
}

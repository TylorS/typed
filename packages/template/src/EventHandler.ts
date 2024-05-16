/**
 * @since 1.0.0
 */
import { type EventWithTarget, isUsingKeyModifier } from "@typed/dom/EventTarget"
import * as Effect from "effect/Effect"
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
  readonly handler: (event: Ev) => Effect.Effect<unknown, E, R>
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
export function make<Ev extends Event, E = never, R = never>(
  handler: (event: Ev) => Effect.Effect<unknown, E, R>,
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
  handler: (event: Ev) => Effect.Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R> {
  return make((ev) => (ev.preventDefault(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export function stopPropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect.Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R> {
  return make((ev) => (ev.stopPropagation(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export function stopImmediatePropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect.Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R> {
  return make((ev) => (ev.stopImmediatePropagation(), handler(ev)), options)
}

/**
 * @since 1.0.0
 */
export type EventOptions = {
  readonly preventDefault?: boolean
  readonly stopPropagation?: boolean
  readonly stopImmediatePropagation?: boolean
}

function handleEventOptions<Ev extends Event>(
  eventOptions: EventOptions,
  ev: Ev
): boolean {
  if (eventOptions.preventDefault) ev.preventDefault()
  if (eventOptions.stopPropagation) ev.stopPropagation()
  if (eventOptions.stopImmediatePropagation) ev.stopImmediatePropagation()

  return true
}

/**
 * @since 1.0.0
 */
export function target<T extends HTMLElement>(eventOptions?: {
  preventDefault?: boolean
  stopPropagation?: boolean
  stopImmediatePropagation?: boolean
}) {
  return <R, E, Ev extends Event>(
    handler: (event: EventWithTarget<T, Ev>) => Effect.Effect<unknown, E, R>,
    options?: AddEventListenerOptions
  ): EventHandler<EventWithTarget<T, Ev>, E, R> => {
    return make(
      eventOptions ?
        (ev) => {
          handleEventOptions(eventOptions, ev)
          return handler(ev)
        } :
        handler,
      options
    )
  }
}

/**
 * @since 1.0.0
 */
export function keys<Keys extends ReadonlyArray<string>>(...keys: Keys) {
  return <E, R>(
    handler: (event: KeyboardEvent & { key: Keys[number] }) => Effect.Effect<unknown, E, R>,
    options?: AddEventListenerOptions & EventOptions
  ): EventHandler<KeyboardEvent, E, R> =>
    make(
      (ev: KeyboardEvent) =>
        !isUsingKeyModifier(ev) && keys.includes(ev.key)
          ? (options && handleEventOptions(options, ev), handler(ev as any))
          : Effect.void,
      options
    )
}

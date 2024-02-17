/**
 * Low-level Effect wrappers for Window and its usage via Context.
 * @since 8.19.0
 */

import * as Context from "@typed/context"
import * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

import * as EventTarget from "./EventTarget.js"

/**
 * Context for the Window object
 * @since 8.19.0
 * @category models
 */
export interface Window extends globalThis.Window {}

/**
 * Context for the Window object
 * @since 8.19.0
 * @category context
 */
export const Window: Context.Tagged<Window> = Context.Tagged<Window>("@typed/dom/Window")

/**
 * Get the innerWidth from the Window
 * @since 8.19.0
 * @category getters
 */
export const getInnerWidth: Effect.Effect<number, never, Window> = Window.with((w) => w.innerWidth)

/**
 * Get the innerHeight from the Window
 * @since 8.19.0
 * @category getters
 */
export const getInnerHeight: Effect.Effect<number, never, Window> = Window.with(
  (w) => w.innerHeight
)

/**
 * Get the computed style of an Element
 * @since 8.19.0
 * @category getters
 */
export const getComputedStyle: (el: Element) => Effect.Effect<CSSStyleDeclaration, never, Window> = (
  el: Element
): Effect.Effect<CSSStyleDeclaration, never, Window> =>
  Window.withEffect((w) => Effect.sync(() => w.getComputedStyle(el)))

/**
 * Add an event listener to the Window
 * @since 8.19.0
 * @category events
 */
export const addWindowListener: <EventName extends string, R = never>(
  options: EventTarget.AddEventListenerOptions<Window, EventName, R>
) => Effect.Effect<void, never, Scope.Scope | Window | R> = <EventName extends string, R = never>(
  options: EventTarget.AddEventListenerOptions<Window, EventName, R>
): Effect.Effect<void, never, R | Window | Scope.Scope> =>
  Window.withEffect((d) => EventTarget.addEventListener(d, options))

/**
 * Contextual represenation of the root element of your application
 * @since 8.19.0
 */

import * as Context from "@typed/context"
import type * as Effect from "effect/Effect"

import type * as Scope from "effect/Scope"
import type { AddEventListenerOptions } from "./EventTarget.js"
import { addEventListener } from "./EventTarget.js"

/**
 * The root element of your application
 * @since 8.19.0
 * @category models
 */
export interface RootElement {
  readonly rootElement: ParentNode & HTMLElement
}

/**
 * The root element of your application
 * @since 8.19.0
 * @category context
 */
export const RootElement: Context.Tagged<RootElement> = Context.Tagged<RootElement>("@typed/dom/RootElement")

/**
 * Add an event listener to the root of your application.
 * @since 8.19.0
 * @category models
 */
export const addRootElementListener = <EventName extends string, R = never>(
  options: AddEventListenerOptions<ParentNode & HTMLElement, EventName, R>
): Effect.Effect<void, never, R | RootElement | Scope.Scope> =>
  RootElement.withEffect((r) => addEventListener(r.rootElement, options))

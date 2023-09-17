/**
 * Contextual represenation of the root element of your application
 * @since 8.19.0
 */

import type * as Effect from "@effect/io/Effect"
import * as C from "@typed/context"

import type * as Scope from "@effect/io/Scope"
import type { AddEventListenerOptions } from "./EventTarget"
import { addEventListener } from "./EventTarget"

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
export const RootElement: C.Tagged<RootElement> = C.Tagged<RootElement>("@typed/dom/RootElement")

/**
 * Add an event listener to the root of your application.
 * @since 8.19.0
 * @category models
 */
export const addRootElementListener = <EventName extends string, R = never>(
  options: AddEventListenerOptions<ParentNode & HTMLElement, EventName, R>
): Effect.Effect<R | RootElement | Scope.Scope, never, void> =>
  RootElement.withEffect((r) => addEventListener(r.rootElement, options))

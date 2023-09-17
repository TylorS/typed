/**
 * Contextual represenation of the parentElement of an HTMLElement
 * @since 8.19.0
 */

import * as Option from "@effect/data/Option"
import type * as Effect from "@effect/io/Effect"
import type * as Scope from "@effect/io/Scope"
import * as Context from "@typed/context"

import * as EventTarget from "./EventTarget"
import type { GlobalThis } from "./GlobalThis"

/**
 * A Context for the parentElement of an HTMLElement
 * @since 8.19.0
 * @category models
 */
export interface ParentElement {
  readonly parentElement: ParentNode & HTMLElement
}

/**
 * A Context for the parentElement of an HTMLElement
 * @since 8.19.0
 * @category context
 */
export const ParentElement: Context.Tagged<ParentElement> = Context.Tagged<ParentElement>("@typed/dom/ParentElement")

/**
 * Query for an element using a CSS selector, relative to the current ParentElement
 * @since 8.19.0
 * @category getters
 */
export const querySelector: <A extends HTMLElement>(
  selector: string
) => Effect.Effect<ParentElement, never, Option.Option<A>> = <A extends HTMLElement>(
  selector: string
) => ParentElement.with((p) => Option.fromNullable(p.parentElement.querySelector<A>(selector)))

/**
 * Query for multiple elements using a CSS selector, relative to the current ParentElement
 * @since 8.19.0
 * @category getters
 */
export const querySelectorAll: <A extends HTMLElement>(
  selector: string
) => Effect.Effect<ParentElement, never, ReadonlyArray<A>> = <A extends HTMLElement>(
  selector: string
) =>
  ParentElement.with(
    (p): ReadonlyArray<A> => Array.from(p.parentElement.querySelectorAll<A>(selector))
  )

/**
 * Dispatch an Event from the current ParentElement
 * @since 8.19.0
 * @category actions
 */
export const dispatchEvent = <EventName extends keyof HTMLElementEventMap>(
  event: EventName,
  options?: EventInit
): Effect.Effect<GlobalThis | ParentElement, never, boolean> =>
  ParentElement.withEffect((p) => EventTarget.dispatchEvent(p.parentElement, event, options))

/**
 * Add an event listener to the current ParentElement
 * @since 8.19.0
 * @category getters
 */
export const addParentElementListener = <EventName extends string, R = never>(
  options: EventTarget.AddEventListenerOptions<ParentNode & HTMLElement, EventName, R>
): Effect.Effect<R | ParentElement | Scope.Scope, never, void> =>
  ParentElement.withEffect((p) => EventTarget.addEventListener(p.parentElement, options))

/**
 * @since 1.0.0
 */

import { Tagged } from "@typed/context/Extensions"
import type { NoSuchElementException } from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

/**
 * @since 1.0.0
 */
export interface CustomElementRegistry extends globalThis.CustomElementRegistry {}

/**
 * @since 1.0.0
 */
export type CustomElementConstructor = globalThis.CustomElementConstructor

/**
 * @since 1.0.0
 */
export type ElementDefinitionOptions = globalThis.ElementDefinitionOptions

/**
 * @since 1.0.0
 */
export const CustomElementRegistry: Tagged<CustomElementRegistry> = Tagged<CustomElementRegistry>(
  "@typed/dom/CustomElementRegister"
)

/**
 * @since 1.0.0
 */
export const get = <K extends keyof HTMLElementTagNameMap>(
  name: K
): Effect.Effect<CustomElementRegistry, NoSuchElementException, CustomElementConstructor> =>
  CustomElementRegistry.withEffect((r) => Option.fromNullable(r.get(name)))

/**
 * @since 1.0.0
 */
export const define = <K extends keyof HTMLElementTagNameMap>(
  name: K,
  constructor: CustomElementConstructor,
  options?: ElementDefinitionOptions
): Effect.Effect<CustomElementRegistry, never, void> =>
  CustomElementRegistry.with((r) => r.define(name, constructor, options))

/**
 * @since 1.0.0
 */
export const whenDefined = <K extends keyof HTMLElementTagNameMap>(
  name: K
): Effect.Effect<CustomElementRegistry, never, CustomElementConstructor> =>
  CustomElementRegistry.withEffect((r) => Effect.promise(() => r.whenDefined(name)))

/**
 * @since 1.0.0
 */
export const upgrade = (
  node: Node
): Effect.Effect<CustomElementRegistry, never, void> => CustomElementRegistry.with((r) => r.upgrade(node))

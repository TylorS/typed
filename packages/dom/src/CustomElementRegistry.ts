import { Tagged } from "@typed/context/Extensions"
import type { NoSuchElementException } from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

export interface CustomElementRegistry extends globalThis.CustomElementRegistry {}

export type CustomElementConstructor = globalThis.CustomElementConstructor

export type ElementDefinitionOptions = globalThis.ElementDefinitionOptions

export const CustomElementRegistry: Tagged<CustomElementRegistry> = Tagged<CustomElementRegistry>(
  "@typed/dom/CustomElementRegister"
)

export const get = <K extends keyof HTMLElementTagNameMap>(
  name: K
): Effect.Effect<CustomElementRegistry, NoSuchElementException, CustomElementConstructor> =>
  CustomElementRegistry.withEffect((r) => Option.fromNullable(r.get(name)))

export const define = <K extends keyof HTMLElementTagNameMap>(
  name: K,
  constructor: CustomElementConstructor,
  options?: ElementDefinitionOptions
): Effect.Effect<CustomElementRegistry, never, void> =>
  CustomElementRegistry.with((r) => r.define(name, constructor, options))

export const whenDefined = <K extends keyof HTMLElementTagNameMap>(
  name: K
): Effect.Effect<CustomElementRegistry, never, CustomElementConstructor> =>
  CustomElementRegistry.withEffect((r) => Effect.promise(() => r.whenDefined(name)))

export const upgrade = (
  node: Node
): Effect.Effect<CustomElementRegistry, never, void> => CustomElementRegistry.with((r) => r.upgrade(node))

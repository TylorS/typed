// oxlint-disable typescript/no-redundant-type-constituents
// oxlint-disable typescript/no-duplicate-type-constituents

import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import type * as Stream from "effect/Stream";
import type { Fx } from "@typed/fx";
import type { HydrationRef } from "@typed/fx/RefSubject";
import type * as EventHandler from "./EventHandler.js";
import type { Many } from "./many.js";
import { type RenderEvent } from "./RenderEvent.js";

/**
 * Represents any value that can be rendered into a template.
 *
 * This includes:
 * - Primitives (string, number, boolean, null, undefined)
 * - Arrays of Renderables
 * - Effects that produce a Renderable
 * - Streams (Fx or Stream) that emit Renderables
 * - Objects (typically for setting properties or attributes)
 *
 * @remarks
 * ## Why
 *
 * `Renderable` is deliberately a union of Effect ecosystem values and ordinary
 * data rather than a component base class. Effect, Stream, Fx, hydration refs,
 * arrays, objects, primitives, and `RenderEvent` outputs preserve their own
 * success, error, and service channels through template inference.
 *
 * ## Ownership and lifetime
 *
 * A Renderable is a description or borrowed value. Calling `html` does not run
 * it; the Scope that drains the resulting Fx owns upstream subscriptions,
 * interruption, and finalizers. Existing DOM nodes retain their identity and
 * external owner until inserted into a renderer-owned dynamic range.
 *
 * @see https://effect.website/docs/stream/introduction/
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { html } from "@typed/template"
 * import { Fx } from "@typed/fx"
 * import { RefSubject } from "@typed/fx/RefSubject"
 *
 * // Primitives
 * const primitive = html`<div>${"Hello"}</div>`
 * const number = html`<div>${42}</div>`
 * const boolean = html`<div>${true}</div>`
 *
 * // Effects
 * const effect = html`<div>${Effect.succeed("Async value")}</div>`
 *
 * // Fx streams (reactive)
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(0)
 *   return html`<div>Count: ${count}</div>`
 * })
 *
 * // Arrays
 * const items = [1, 2, 3]
 * const list = html`<ul>${items.map((n) => html`<li>${n}</li>`)}</ul>`
 *
 * // Objects (for attributes)
 * const withProps = html`<div .data=${{ foo: "bar" }}></div>`
 * ```
 *
 * @since 1.0.0
 * @category Renderable inputs
 */
export type Renderable<A, E = never, R = never> =
  | A
  | { readonly [key: string]: Renderable<unknown, E, R> } // TODO: How to better handle .data and ...spread attributes???
  | ReadonlyArray<Renderable<A, E, R>>
  | Effect.Effect<A, E, R>
  | Stream.Stream<A, E, R>
  | Fx.Fx<A, E, R>
  | HydrationRef<E, R>
  | ([A] extends [ReadonlyArray<infer Item>] ? Many<Item, E, R> : never);

export declare namespace Renderable {
  /**
   * A type alias for any Renderable value with any error/context.
   *
   * @remarks
   * ## Why
   *
   * Generic renderer boundaries need an existential input while specific APIs
   * still recover channels through `Renderable.Error` and `.Services`.
   *
   * ## Ownership and lifetime
   *
   * This compile-time union owns no value.
   *
   * @since 1.0.0
   * @category Renderable inputs
   */
  export type Any<A = any> =
    | Renderable<A, any, any>
    | Renderable<A, never, never>
    | Renderable<never, any, any>
    | Renderable<never, never, any>;

  /**
   * The basic primitive types that can be rendered directly.
   *
   * @remarks
   * ## Why
   *
   * Primitive output and already-rendered DOM/HTML events form the terminal
   * values consumed by renderer implementations.
   *
   * ## Ownership and lifetime
   *
   * The alias introduces no ownership; `RenderEvent` keeps producer semantics.
   *
   * @since 1.0.0
   * @category Terminal renderable values
   */
  export type Primitive =
    | string
    | number
    | boolean
    | bigint
    | null
    | undefined
    | void
    | RenderEvent;

  /**
   * The Effect ecosystem producers recognized as reactive Renderables.
   *
   * @remarks
   * ## Why
   *
   * Typed adds template semantics to Effect, Stream, and Fx instead of replacing
   * them with framework-specific state or scheduling.
   *
   * ## Ownership and lifetime
   *
   * The Scope running the lifted producer owns acquisition and interruption.
   *
   * @since 1.0.0
   * @category Renderable producers
   */
  export type Effects =
    | Effect.Effect<any, any, any>
    | Fx.Fx<any, any, any>
    | Stream.Stream<any, any, any>;

  /**
   * Extracts the required services from a Renderable type.
   *
   * @remarks
   * ## Why
   *
   * Nested producers and event handlers must keep the full Effect `R` channel.
   *
   * ## Ownership and lifetime
   *
   * This projection acquires no services.
   *
   * @since 1.0.0
   * @category Renderable requirements
   */
  export type Services<T> = RenderableServices<T>;

  /**
   * Extracts the error type from a Renderable type.
   *
   * @remarks
   * ## Why
   *
   * Rendering failures remain typed instead of surfacing through an untyped
   * component error boundary.
   *
   * ## Ownership and lifetime
   *
   * This projection has no runtime lifetime.
   *
   * @since 1.0.0
   * @category Renderable failures
   */
  export type Error<T> = RenderableError<T>;

  /**
   * Extracts the success type from a Renderable type.
   */
  /**
   * Recursively computes the terminal value emitted by a Renderable.
   *
   * @remarks
   * ## Why
   *
   * Effects, Options, arrays, and object structures are lifted without losing
   * their resulting shape.
   *
   * ## Ownership and lifetime
   *
   * This projection describes values but owns none of them.
   *
   * @since 1.0.0
   * @category Renderable output inference
   */
  export type Success<T> = [T] extends [never]
    ? never
    : T extends Many<infer A, any, any>
      ? ReadonlyArray<A>
      : T extends Fx.Fx<infer A, any, any>
        ? A
        : T extends Stream.Stream<infer A, any, any>
          ? A
          : T extends Effect.Effect<infer A, any, any>
            ? Success<A>
            : T extends Option.Option<infer A>
              ? Success<A> | null
              : T extends ReadonlyArray<any>
                ? { readonly [K in keyof T]: Success<T[K]> }
                : T extends null | undefined | void
                  ? null
                  : T extends (...args: Array<any>) => any
                    ? null
                    : T extends RenderEvent
                      ? T
                      : T extends object
                        ? { readonly [K in keyof T]: Success<T[K]> }
                        : T;

  // Helpers for arbitrary objects

  /**
   * Traverse all keys in an object and extract the services from each value. If
   * the value is a function, extract the services from the return type of the function.
   *
   * @remarks
   * ## Why
   *
   * Spread, data, and property objects may contain nested Effect producers whose
   * requirements must remain visible in the enclosing template.
   *
   * ## Ownership and lifetime
   *
   * This compile-time traversal acquires no service.
   *
   * @since 1.0.0
   * @category Renderable requirements
   */
  export type ServicesFromObject<T> = [
    {
      [K in keyof T]-?: T[K] extends (...args: Array<any>) => any
        ? FunctionServices<ReturnType<T[K]>>
        : Services<T[K]>;
    }[keyof T],
  ] extends [infer U]
    ? U
    : never;

  /**
   * Traverse all keys in an object and extract the error from each value. If
   * the value is a function, extract the error from the return type of the function.
   *
   * @remarks
   * ## Why
   *
   * Nested object renderables contribute failures to the enclosing template
   * instead of hiding them behind runtime property access.
   *
   * ## Ownership and lifetime
   *
   * This compile-time traversal has no runtime lifetime.
   *
   * @since 1.0.0
   * @category Renderable failures
   */
  export type ErrorFromObject<T> = [
    {
      [K in keyof T]-?: T[K] extends (...args: Array<any>) => any
        ? FunctionError<ReturnType<T[K]>>
        : Error<T[K]>;
    }[keyof T],
  ] extends [infer U]
    ? U
    : never;
}

type RenderableServices<T> =
  IsAny<T> extends true ? any : T extends unknown ? RenderableServicesSingle<T> : never;

type RenderableServicesSingle<T> =
  | Fx.Services<T>
  | (T extends Stream.Stream<any, any, any> ? Stream.Services<T> : never)
  | Effect.Services<T>
  | (T extends HydrationRef<any, infer R> ? R : never)
  | EventHandler.Services<T>
  | (T extends Many<any, any, infer R> ? R : never)
  | NestedServices<T>;

type RenderableError<T> =
  IsAny<T> extends true ? any : T extends unknown ? RenderableErrorSingle<T> : never;

type RenderableErrorSingle<T> =
  | Fx.Error<T>
  | (T extends Stream.Stream<any, any, any> ? Stream.Error<T> : never)
  | Effect.Error<T>
  | (T extends HydrationRef<infer E, any> ? E : never)
  | EventHandler.Error<T>
  | (T extends Many<any, infer E, any> ? E : never)
  | NestedError<T>;

type NestedServices<T> = T extends
  | Renderable.Effects
  | Option.Option<any>
  | HydrationRef<any, any>
  | EventHandler.EventHandler<any, any, any>
  | Many<any, any, any>
  | AtomicObject
  ? never
  : T extends (...args: Array<any>) => infer U
    ? FunctionServices<U>
    : T extends ReadonlyArray<infer U>
      ? Renderable.Services<U>
      : T extends object
        ? Renderable.ServicesFromObject<T>
        : never;

type NestedError<T> = T extends
  | Renderable.Effects
  | Option.Option<any>
  | HydrationRef<any, any>
  | EventHandler.EventHandler<any, any, any>
  | Many<any, any, any>
  | AtomicObject
  ? never
  : T extends (...args: Array<any>) => infer U
    ? FunctionError<U>
    : T extends ReadonlyArray<infer U>
      ? Renderable.Error<U>
      : T extends object
        ? Renderable.ErrorFromObject<T>
        : never;

type IsAny<T> = 0 extends 1 & T ? true : false;

type AtomicObject =
  | globalThis.Event
  | globalThis.EventTarget
  | globalThis.CSSRule
  | globalThis.CSSStyleDeclaration
  | globalThis.StyleSheet
  | Date
  | RegExp;

type FunctionServices<T> = T extends Renderable.Effects
  ? Renderable.Services<T>
  : T extends ReadonlyArray<infer U>
    ? FunctionServices<U>
    : never;

type FunctionError<T> = T extends Renderable.Effects
  ? Renderable.Error<T>
  : T extends ReadonlyArray<infer U>
    ? FunctionError<U>
    : never;

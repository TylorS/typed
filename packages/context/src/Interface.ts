/**
 * Helpers for adding useful methods to Tag services.
 * @since 1.0.0
 */

import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"

import type { Tag } from "@effect/data/Context"
import type { Scope } from "@effect/io/Scope"
import { ContextBuilder } from "./Builder"

/**
 * A Tagged service that can be utilized from the Effect Context.
 * @since 1.0.0
 */
export interface Tagged<I, S> extends Actions<I, S>, Provision<I, S> {}

/**
 * Create a Tagged service that can be utilized from the Effect Context.
 * @since 1.0.0
 */
export function tagged<I, S>(tag: Tag<I, S>): Tag<I, S> & Tagged<I, S> {
  return Object.assign(tag, Actions.fromTag(tag), Provision.fromTag(tag))
}

/**
 * Create a Tagged service that can be utilized from the Effect Context.
 * @since 1.0.0
 */
export interface Actions<I, S> {
  /**
   * Apply a function to the service in the environment
   */
  readonly with: <A>(f: (s: S) => A) => Effect.Effect<I, never, A>
  /**
   * Perform an Effect with the service in the environment
   */
  readonly withEffect: <R, E, A>(f: (s: S) => Effect.Effect<R, E, A>) => Effect.Effect<R | I, E, A>
}

/**
 * Create a Tagged service that can be utilized from the Effect Context.
 * @since 1.0.0
 */
export function withActions<T extends Tag<any, any>>(tag: T): T & Actions<Tag.Identifier<T>, Tag.Service<T>> {
  return Object.assign(tag, Actions.fromTag(tag))
}

/**
 * @since 1.0.0
 */
export namespace Actions {
  /**
   * Create Actions from a Tag
   */
  export function fromTag<I, S>(tag: Tag<I, S>): Actions<I, S> {
    return {
      with: <A>(f: (s: S) => A) => Effect.map(tag, f),
      withEffect: <R, E, A>(f: (s: S) => Effect.Effect<R, E, A>) => Effect.flatMap(tag, f)
    }
  }
}

/**
 * @since 1.0.0
 */
export interface Provision<I, S> {
  /**
   * Create a ContextBuilder from the service
   */
  readonly build: (s: S) => ContextBuilder<I>
  readonly provide: (service: S) => <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<Exclude<R, I>, E, A>
  readonly provideEffect: <R2, E2>(
    effect: Effect.Effect<R2, E2, S>
  ) => <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R2 | Exclude<R, I>, E | E2, A>
  readonly layer: <R, E>(effect: Effect.Effect<R, E, S>) => Layer.Layer<R, E, I>
  readonly scoped: <R, E>(effect: Effect.Effect<R, E, S>) => Layer.Layer<Exclude<R, Scope>, E, I>
}

/**
 * Add Provision to a Tag
 * @since 1.0.0
 */
export function withProvision<T extends Tag<any, any>>(tag: T): T & Provision<Tag.Identifier<T>, Tag.Service<T>> {
  return Object.assign(tag, Provision.fromTag(tag))
}

/**
 * @since 1.0.0
 */
export namespace Provision {
  /**
   * Create Provision from a Tag
   * @since 1.0.0
   */
  export function fromTag<I, S>(tag: Tag<I, S>): Provision<I, S> {
    return {
      build: (s: S) => ContextBuilder.fromTag(tag, s),
      provide: (service) => Effect.provideService(tag, service),
      provideEffect: (effect) => Effect.provideServiceEffect(tag, effect),
      layer: (effect) => Layer.effect(tag, effect),
      scoped: (effect) => Layer.scoped(tag, effect)
    }
  }
}

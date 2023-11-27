/**
 * Helpers for adding useful methods to Tag services.
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

import { ContextBuilder } from "./Builder"
import type { IdentifierFactory, IdentifierOf } from "./Identifier"
import { Tag } from "effect/Context"
import type { Scope } from "effect/Scope"

/**
 * A Tagged service is a @effect/data/Context.Tag with additional methods for
 * utilizing and providing the service without needing additional imports from Effect, Layer, or Context
 * so you're not redefining the same methods over and over again.
 *
 * @since 1.0.0
 * @category models
 */
export interface Tagged<I, S = I> extends Tag<I, S>, Actions<I, S>, Provision<I, S> {}

/**
 * Construct a Tagged implementation to be utilized from the Effect Context.
 * @since 1.0.0
 */
export function Tagged<const I extends IdentifierFactory<any>, S = I>(id: I | string): Tagged<IdentifierOf<I>, S>
export function Tagged<const I, S = I>(id: I | string): Tagged<IdentifierOf<I>, S>
export function Tagged<const I, S>(id: I): Tagged<IdentifierOf<I>, S>
export function Tagged<S>(): {
  <const I extends IdentifierFactory<any>>(id: I): Tagged<IdentifierOf<I>, S>
  <const I>(id: I | string): Tagged<IdentifierOf<I>, S>
}

export function Tagged<S>(id?: unknown) {
  if (arguments.length > 0) {
    return fromTag(Tag<any, S>(id))
  } else {
    return (id: unknown) => fromTag(Tag<any, S>(id))
  }
}

/**
 * Create a Tagged service that can be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function fromTag<I, S>(tag: Tag<I, S>): Tagged<I, S> {
  return Object.assign(tag, Actions.fromTag(tag), Provision.fromTag(tag))
}

/**
 * Create a Tagged service that can be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
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
 * @category constructors
 */
export function withActions<T extends Tag<any, any>>(tag: T): T & Actions<Tag.Identifier<T>, Tag.Service<T>> {
  return Object.assign(tag, Actions.fromTag(tag))
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const Actions: {
  /**
   * Create Actions from a Tag
   * @since 1.0.0
   * @category constructors
   */
  fromTag: <I, S>(tag: Tag<I, S>) => Actions<I, S>
} = {
  /**
   * Create Actions from a Tag
   * @since 1.0.0
   * @category constructors
   */
  fromTag: function fromTag<I, S>(tag: Tag<I, S>): Actions<I, S> {
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
   * @since 1.0.0
   */
  readonly build: (s: S) => ContextBuilder<I>

  /**
   * Provide a service to an Effect
   * @since 1.0.0
   */
  readonly provide: (service: S) => <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<Exclude<R, I>, E, A>

  /**
   * Provide a service to an Effect using a service Effect
   * @since 1.0.0
   */
  readonly provideEffect: <R2, E2>(
    effect: Effect.Effect<R2, E2, S>
  ) => <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R2 | Exclude<R, I>, E | E2, A>

  /**
   * Create a Layer from the service
   * @since 1.0.0
   */
  readonly layer: <R = never, E = never>(
    effect: Effect.Effect<R, E, S> | Exclude<S, Effect.Effect<any, any, any>>
  ) => Layer.Layer<R, E, I>

  /**
   * Create a Layer from the service that is scoped.
   * @since 1.0.0
   */
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
export const Provision: {
  /**
   * Create Provision from a Tag
   * @since 1.0.0
   * @category constructors
   */
  readonly fromTag: <I, S>(tag: Tag<I, S>) => Provision<I, S>
} = {
  /**
   * Create Provision from a Tag
   * @since 1.0.0
   * @category constructors
   */
  fromTag: function fromTag<I, S>(tag: Tag<I, S>): Provision<I, S> {
    return {
      build: (s: S) => ContextBuilder.fromTag(tag, s),
      provide: (service) => Effect.provideService(tag, service),
      provideEffect: (effect) => Effect.provideServiceEffect(tag, effect),
      layer: (service) => Layer.effect(tag, Effect.isEffect(service) ? service : Effect.succeed(service)),
      scoped: (service) => Layer.scoped(tag, service)
    }
  }
} as const

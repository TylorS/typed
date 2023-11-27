/**
 * A RefSubject is the core abstraction for keeping state and subscribing to its
 * changes over time.
 *
 * @since 1.18.0
 */

import type { Schema } from "@effect/schema"
import * as C from "@typed/context"
import type { Stream, SubscriptionRef } from "effect"
import { Cause, Exit, identity } from "effect"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import { dual } from "effect/Function"
import type * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type * as Scope from "effect/Scope"
import { Computed, fromTag } from "./Computed"
import { Filtered } from "./Filtered"
import type * as Fx from "./Fx"
import { fromStream, provide, skipRepeatsWith } from "./internal/core"
import * as coreRefSubject from "./internal/core-ref-subject"
import { exit, fromFxEffect } from "./internal/fx"
import { FxEffectBase } from "./internal/protos"
import { fromRefSubject, toRefSubject } from "./internal/schema-ref-subject"
import type * as Subject from "./Subject"
import { ComputedTypeId, RefSubjectTypeId } from "./TypeId"
import * as Versioned from "./Versioned"

/**
 * A RefSubject is a Subject that has a current value that can be read and updated.
 * @since 1.18.0
 * @category models
 */
export interface RefSubject<R, in out E, in out A> extends Computed<R, E, A>, Subject.Subject<R, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  /**
   * Get the current value of this RefSubject. If the RefSubject has not been initialized
   * then the initial value will be computed and returned. Concurrent calls to `get` will
   * only compute the initial value once.
   * @since 1.18.0
   */
  readonly get: Effect.Effect<R, E, A>

  /**
   * Set the current value of this RefSubject.
   * @since 1.18.0
   */
  readonly set: (a: A) => Effect.Effect<R, never, A>

  /**
   * Modify the current value of this RefSubject using the provided function.
   * @since 1.18.0
   */
  readonly update: (f: (a: A) => A) => Effect.Effect<R, E, A>

  /**
   * Modify the current value of this RefSubject and compute a new value.
   * @since 1.18.0
   */
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<R, E, B>

  /**
   * Delete the current value of this RefSubject. If it was not initialized the Option.none will be returned.
   * Otherwise the current value will be returned as an Option.some and the RefSubject will be uninitialized.
   * If there are existing subscribers to this RefSubject then the RefSubject will be re-initialized.
   * @since 1.18.0
   */
  readonly delete: Effect.Effect<R, never, Option.Option<A>>

  /**
   * Modify the current value of this RefSubject and compute a new value using the provided effectful function.
   * @since 1.18.0
   */
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<R | R2, E | E2, B>

  /**
   * Modify the current value of this RefSubject using the provided effectful function.
   * @since 1.18.0
   */
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R | R2, E | E2, A>

  /**
   * Modify the current value of this RefSubject and compute a new value using the provided effectful function.
   * The key difference is it will allow running a workflow and setting the value multiple times. Optionally,
   * another function can be provided to change the value
   * @since 1.18.0
   */
  readonly runUpdate: <R2, E2, B, R3 = never, E3 = never>(
    updates: (
      get: RefSubject<R, E, A>["get"],
      set: RefSubject<R, E, A>["set"]
    ) => Effect.Effect<R2, E2, B>,
    onInterrupt?: (a: A) => Effect.Effect<R3, E3, A>
  ) => Effect.Effect<R | R2 | R3, E | E2 | E3, B>

  /**
   * Interrupt the current Fibers.
   */
  readonly interrupt: Effect.Effect<R, never, void>
}

/**
 * @since 1.18.0
 */
export namespace RefSubject {
  /**
   * @since 1.18.0
   */
  export type Any =
    | RefSubject<any, any, any>
    | RefSubject<never, any, any>
    | RefSubject<any, never, any>
    | RefSubject<never, never, any>

  /**
   * A Contextual wrapper around a RefSubject
   * @since 1.18.0
   * @category models
   */
  export interface Tagged<I, E, A> extends RefSubject<I, E, A> {
    readonly tag: C.Tagged<I, RefSubject<never, E, A>>

    /**
     * Make a layer initializing a RefSubject
     * @since 1.18.0
     */
    readonly make: <R = never>(
      fx: Exclude<Fx.FxInput<R, E, A>, Iterable<A>>,
      eq?: Equivalence<A>
    ) => Layer.Layer<R, never, I>

    /**
     * Make a layer initializing a RefSubject
     * @since 1.18.0
     */
    readonly of: (value: A, eq?: Equivalence<A>) => Layer.Layer<never, never, I>

    /**
     * Provide an implementation of this RefSubject
     * @since 1.18.0
     */
    readonly provide: <R2>(fx: Fx.FxInput<R2, E, A>, eq?: Equivalence<A>) => <R3, E3, C>(
      effect: Effect.Effect<R3, E3, C>
    ) => Effect.Effect<R2 | Exclude<R3, I> | Scope.Scope, E | E3, C>

    /**
     * Provide an implementation of this RefSubject
     * @since 1.18.0
     */
    readonly provideFx: <R2>(fx: Fx.FxInput<R2, E, A>, eq?: Equivalence<A>) => <R3, E3, C>(
      effect: Fx.Fx<R3, E3, C>
    ) => Fx.Fx<R2 | Exclude<R3, I> | Scope.Scope, E | E3, C>
  }

  /**
   * A Contextual wrapper around a RefSubject
   * @since 1.18.0
   * @category models
   */
  export interface Derived<R0, R, E, A> extends RefSubject<R, E, A> {
    readonly persist: Effect.Effect<R0, never, void>
  }

  /**
   * Extract the Identifier from a RefSubject
   * @since 1.18.0
   */
  export type Context<T> = T extends RefSubject<infer I, infer _, infer __> ? I : never

  /**
   * Extract the Error from a RefSubject
   * @since 1.18.0
   */
  export type Error<T> = T extends RefSubject<infer _, infer E, infer __> ? E : never

  /**
   * Extract the State from a RefSubject
   * @since 1.18.0
   */
  export type Success<T> = T extends RefSubject<infer _, infer __, infer S> ? S : never
}

/**
 * Extract the Identifier from a RefSubject
 * @since 1.18.0
 */
export type Context<T> = RefSubject.Context<T>

/**
 * Extract the Error from a RefSubject
 * @since 1.18.0
 */
export type Error<T> = RefSubject.Error<T>

/**
 * Extract the State from a RefSubject
 * @since 1.18.0
 */
export type Success<T> = RefSubject.Success<T>

/**
 * Construct a RefSubject with a lazily initialized value.
 * @since 1.18.0
 * @category constructors
 */
export function fromEffect<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>> {
  return coreRefSubject.fromEffect(initial, eq)
}

/**
 * Construct a RefSubject from a synchronous value.
 * @since 1.18.0
 * @category constructors
 */
export function of<A, E = never>(
  initial: A,
  eq?: Equivalence<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, E, A>> {
  return fromEffect<never, E, A>(Effect.succeed(initial), eq)
}

/**
 * Construct a RefSubject from a synchronous value.
 * @since 1.18.0
 * @category constructors
 */
export function sync<A, E = never>(
  initial: () => A,
  eq?: Equivalence<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, E, A>> {
  return fromEffect<never, E, A>(Effect.sync(initial), eq)
}

/**
 * Construct a RefSubject from any Fx value.
 *
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E, A>(
  fx: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>
export function make<R, E, A>(
  fx: Fx.FxInput<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>

export function make<R, E, A>(
  fx: Fx.FxInput<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>> {
  return coreRefSubject.make(fx, eq)
}

/**
 * Create a contextual wrapper around a RefSubject while maintaing the full API of
 * a Ref Subject.
 * @since 1.18.0
 * @category constructors
 */
export function tagged<A>(defaultEq?: Equivalence<A>): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.Tagged<C.IdentifierOf<I>, never, A>
  <const I>(identifier: I | string): RefSubject.Tagged<C.IdentifierOf<I>, never, A>
}
export function tagged<E, A>(defaultEq?: Equivalence<A>): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I | string): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
}

export function tagged(defaultEq?: Equivalence<any>): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.Tagged<C.IdentifierOf<I>, any, any> | RefSubject.Tagged<C.IdentifierOf<I>, never, any>
  <const I>(
    identifier: I | string
  ): RefSubject.Tagged<C.IdentifierOf<I>, any, any> | RefSubject.Tagged<C.IdentifierOf<I>, never, any>
} {
  function makeTagged<const I extends C.IdentifierFactory<any>>(
    identifier: I
  ): RefSubject.Tagged<C.IdentifierOf<I>, any, any>
  function makeTagged<const I>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, any, any>
  function makeTagged<const I>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, any, any> {
    return new ContextImpl(C.Tagged<I, RefSubject<never, any, any>>(identifier), defaultEq) as any
  }

  return makeTagged
}

class ContextImpl<I, E, A> extends FxEffectBase<I, E, A, I, E, A> implements RefSubject<I, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  readonly version: RefSubject<I, E, A>["version"]
  readonly subscriberCount: RefSubject<I, E, A>["subscriberCount"]
  readonly get: RefSubject<I, E, A>["get"]
  readonly delete: RefSubject<I, E, A>["delete"]
  readonly interrupt: RefSubject<I, E, A>["interrupt"]

  constructor(readonly tag: C.Tagged<I, RefSubject<never, E, A>>, readonly defaultEq?: Equivalence<A>) {
    super()

    this.version = tag.withEffect((ref) => ref.version)
    this.subscriberCount = tag.withEffect((ref) => ref.subscriberCount)
    this.get = tag.withEffect((ref) => ref.get)
    this.delete = tag.withEffect((ref) => ref.delete)
    this.interrupt = tag.withEffect((r) => r.interrupt)
  }

  protected toFx(): Fx.Fx<I, E, A> {
    return fromFxEffect(this.tag)
  }

  protected toEffect(): Effect.Effect<I, E, A> {
    return this.get
  }

  runUpdate: RefSubject<I, E, A>["runUpdate"] = (
    f,
    onInterrupt
  ) => this.tag.withEffect((ref) => ref.runUpdate(f, onInterrupt))

  modifyEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>) => Effect.Effect<I | R2, E | E2, B> = (
    f
  ) => this.tag.withEffect((ref) => ref.modifyEffect(f))

  modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<I, E, B> = (f) =>
    this.tag.withEffect((ref) => ref.modify(f))

  updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<I | R2, E | E2, A> = (f) =>
    this.tag.withEffect((ref) => ref.updateEffect(f))

  update: (f: (a: A) => A) => Effect.Effect<I, E, A> = (f) => this.tag.withEffect((ref) => ref.update(f))

  set: (a: A) => Effect.Effect<I, never, A> = (a) => this.tag.withEffect((ref) => ref.set(a))

  mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B> = (f) =>
    Computed(this as any, f)

  map: <B>(f: (a: A) => B) => Computed<I, E, B> = (f) => Computed(this as any, (a: A) => Effect.sync(() => f(a)))

  filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<R2, E | E2, B> = (f) => Filtered(this as any, f)

  filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<never, E, B> = (f) =>
    Filtered(this as any, (a: A) => Effect.sync(() => f(a)))

  filter: (f: (a: A) => boolean) => Filtered<I, E, A> = (f) =>
    this.filterMap((a) => f(a) ? Option.some(a) : Option.none())

  filterEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) => Filtered<I | R2, E | E2, A> = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => b ? Option.some(a) : Option.none()))

  skipRepeats: (eq?: Equivalence<A> | undefined) => Computed<I, E, A> = (eq = equals) =>
    fromTag(this.tag, (s) => s.skipRepeats(eq))

  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<I, never, unknown> = (cause) =>
    this.tag.withEffect((ref) => ref.onFailure(cause))

  onSuccess: (value: A) => Effect.Effect<I, never, unknown> = (a) => this.tag.withEffect((ref) => ref.onSuccess(a))

  make = <R>(fx: Fx.Fx<R, E, A>, eq?: Equivalence<A>): Layer.Layer<R, never, I> =>
    this.tag.scoped(make(fx, eq || this.defaultEq))

  of = (value: A, eq?: Equivalence<A>): Layer.Layer<never, never, I> => this.tag.scoped(of(value, eq))

  provide = <R2>(fx: Fx.Fx<R2, E, A>, eq?: Equivalence<A>) => Effect.provide(this.make(fx, eq || this.defaultEq))

  provideFx = <R2>(fx: Fx.Fx<R2, E, A>, eq?: Equivalence<A>) => provide(this.make(fx, eq || this.defaultEq))
}

/**
 * Construct a RefSubject from any Fx value.
 *
 * @since 1.18.0
 * @category constructors
 */
export function makeWithExtension<R, E, A, B>(
  fx: Effect.Effect<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<never, E, A> & B>
export function makeWithExtension<R, E, A, B>(
  fx: Fx.FxInput<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A> & B>

export function makeWithExtension<R, E, A, B>(
  fx: Fx.FxInput<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A> & B> {
  return coreRefSubject.makeWithExtension(fx, f, eq)
}

/**
 * Construct a RefSubject with an initial value and the specified subject.
 * @since 1.18.0
 * @category constructors
 */
export const unsafeMake: <R, E, A>(
  initial: Effect.Effect<R, E, A>,
  subject: Subject.Subject<R, E, A>,
  eq?: Equivalence<A>
) => RefSubject<R, E, A> = coreRefSubject.unsafeMake

/**
 * Flatten an RefSubject of an Option into a Filtered.
 * @since 1.18.0
 * @category combinators
 */
export const compact = <R, E, A>(refSubject: RefSubject<R, E, Option.Option<A>>): Filtered<R, E, A> =>
  refSubject.filterMap(identity)

/**
 * Split a RefSubject's into 2 Filtered values that track its errors and
 * success values separately.
 * @since 1.18.0
 * @category combinators
 */
export const split = <R, E, A>(
  refSubject: RefSubject<R, E, A>
): readonly [Filtered<R, never, E>, Filtered<R, never, A>] => {
  const versioned = Versioned.transform(refSubject, exit, Effect.exit)
  const left = Filtered(versioned, getLeft)
  const right = Filtered(versioned, getRight)

  return [left, right] as const
}

const getLeft = <E, A>(exit: Exit.Exit<E, A>) =>
  Effect.succeed(
    Exit.match(exit, {
      onFailure: (cause) => Cause.failureOption(cause),
      onSuccess: () => Option.none()
    })
  )

const getRight = <E, A>(exit: Exit.Exit<E, A>) =>
  Effect.succeed(
    Exit.match(exit, {
      onFailure: Option.none,
      onSuccess: Option.some
    })
  )

/**
 * MakeRefSubject is a RefSubject factory function dervied from a Schema.
 * @since 1.18.0
 */
export type MakeRefSubject<O> = {
  <R, E>(
    input: RefSubject<R, E, O>,
    eq?: Equivalence<O>
  ): Effect.Effect<R | Scope.Scope, never, ToDerived<R, E, O>>

  <R, E>(input: Effect.Effect<R, E, O>, eq?: Equivalence<O>): Effect.Effect<R | Scope.Scope, never, ToRefSubject<E, O>>

  <R, E>(
    input: Stream.Stream<R, E, O>,
    eq?: Equivalence<O>
  ): Effect.Effect<R | Scope.Scope, never, ToRefSubject<E, O>>

  <R, E>(input: Fx.Fx<R, E, O>, eq?: Equivalence<O>): Effect.Effect<R | Scope.Scope, never, ToRefSubject<E, O>>

  <E>(input: Cause.Cause<E>, eq?: Equivalence<O>): Effect.Effect<Scope.Scope, never, ToRefSubject<E, O>>

  <R, E>(
    input: Fx.FxInput<R, E, O>,
    eq?: Equivalence<O>
  ): Effect.Effect<R | Scope.Scope, never, ToRefSubject<E, O>>
}

/**
 * Converts an error `E` and an output `O` into a RefSubject or a Record of RefSubjects if
 * the ouput value is a Record as well.
 * @since 1.18.0
 */
export type ToRefSubject<E, O> = O extends Readonly<Record<PropertyKey, any>> ? {
    readonly [K in keyof O]: ToRefSubject<E, O[K]>
  } :
  RefSubject<never, E, O> // TODO: We should apply ParseErrors here too somehow

/**
 * Converts an error `E` and an output `O` into a RefSubject or a Record of RefSubjects if
 * the ouput value is a Record as well.
 * @since 1.18.0
 */
export type ToDerived<R, E, O> = ToRefSubject<E, O> & {
  readonly persist: Effect.Effect<R, E, O>
}

/**
 * Derive a RefSubjectSchema using the "from" or "encoded" value represented by a Schema.
 * @since 1.18.0
 */
export function deriveFromSchema<I, O>(schema: Schema.Schema<I, O>): MakeRefSubject<I> {
  return fromRefSubject(schema)
}

/**
 * Derive a RefSubjectSchema using the "to" or "decoded" value represented by a Schema.
 * @since 1.18.0
 */
export function deriveToSchema<I, O>(schema: Schema.Schema<I, O>): MakeRefSubject<O> {
  return toRefSubject(schema)
}

/**
 * @since 1.18.0
 */
export const tuple: <const REFS extends ReadonlyArray<RefSubject.Any>>(
  ...refs: REFS
) => RefSubject<
  RefSubject.Context<REFS[number]>,
  RefSubject.Error<REFS[number]>,
  { readonly [K in keyof REFS]: RefSubject.Success<REFS[K]> }
> = coreRefSubject.tuple

/**
 * @since 1.18.0
 */
export const struct: <const REFS extends Readonly<Record<PropertyKey, RefSubject.Any>>>(
  refs: REFS
) => RefSubject<
  RefSubject.Context<REFS[string]>,
  RefSubject.Error<REFS[string]>,
  { readonly [K in keyof REFS]: RefSubject.Success<REFS[K]> }
> = coreRefSubject.struct

/**
 * @since 1.18.0
 */
export function fromSubscriptionRef<A>(
  subscriptionRef: SubscriptionRef.SubscriptionRef<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, never, A>> {
  return coreRefSubject.make(fromStream(subscriptionRef.changes))
}

/**
 * @since 1.18.0
 */
export const transform: {
  <A, B>(from: (a: A) => B, to: (b: B) => A): <R, E>(ref: RefSubject<R, E, A>) => RefSubject<R, E, B>
  <R, E, A, B>(ref: RefSubject<R, E, A>, from: (a: A) => B, to: (b: B) => A): RefSubject<R, E, B>
} = dual(3, function transform<R, E, A, B>(
  ref: RefSubject<R, E, A>,
  from: (a: A) => B,
  to: (b: B) => A
): RefSubject<R, E, B> {
  return new TransformImpl(ref, from, to)
})

class TransformImpl<R, E, A, B> extends FxEffectBase<R, E, B, R, E, B> implements RefSubject<R, E, B> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  readonly version: RefSubject<R, E, B>["version"]
  readonly subscriberCount: RefSubject<R, E, B>["subscriberCount"]
  readonly get: RefSubject<R, E, B>["get"]
  readonly delete: RefSubject<R, E, B>["delete"]
  readonly interrupt: RefSubject<R, E, B>["interrupt"]

  constructor(
    readonly ref: RefSubject<R, E, A>,
    readonly from: (a: A) => B,
    readonly to: (b: B) => A
  ) {
    super()

    this.version = ref.version
    this.subscriberCount = ref.subscriberCount
    this.get = Effect.map(ref.get, from)
    this.delete = Effect.map(ref.delete, Option.map(from))
    this.interrupt = ref.interrupt
  }

  protected toFx(): Fx.Fx<R, E, B> {
    return this.ref.map(this.from)
  }

  protected toEffect(): Effect.Effect<R, E, B> {
    return this.ref.map(this.from)
  }

  set: RefSubject<R, E, B>["set"] = (b) => Effect.map(this.ref.set(this.to(b)), this.from)
  update: RefSubject<R, E, B>["update"] = (f) => Effect.map(this.ref.update((a) => this.to(f(this.from(a)))), this.from)

  updateEffect: RefSubject<R, E, B>["updateEffect"] = (f) =>
    Effect.map(this.ref.updateEffect((a) => Effect.map(f(this.from(a)), this.to)), this.from)

  modifyEffect: RefSubject<R, E, B>["modifyEffect"] = (f) =>
    this.ref.modifyEffect((a) => Effect.map(f(this.from(a)), ([c, b]) => [c, this.to(b)] as const))

  modify: RefSubject<R, E, B>["modify"] = (f) =>
    this.ref.modify((a) => {
      const [c, b] = f(this.from(a))
      return [c, this.to(b)] as const
    })

  runUpdate: RefSubject<R, E, B>["runUpdate"] = (f) =>
    this.ref.runUpdate((get, set) => f(Effect.map(get, this.from), (b) => Effect.map(set(this.to(b)), this.from)))

  mapEffect: RefSubject<R, E, B>["mapEffect"] = (f) => Computed(this, f)

  map: RefSubject<R, E, B>["map"] = (f) => this.mapEffect((b) => Effect.sync(() => f(b)))

  filterMapEffect: RefSubject<R, E, B>["filterMapEffect"] = (f) => Filtered(this, f)

  filterMap: RefSubject<R, E, B>["filterMap"] = (f) => Filtered(this, (a) => Effect.sync(() => f(a)))

  filter: RefSubject<R, E, B>["filter"] = (f) => this.filterMap((a) => f(a) ? Option.some(a) : Option.none())

  filterEffect: RefSubject<R, E, B>["filterEffect"] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => b ? Option.some(a) : Option.none()))

  onSuccess: RefSubject<R, E, B>["onSuccess"] = (b) => this.ref.onSuccess(this.to(b))

  onFailure: RefSubject<R, E, B>["onFailure"] = (b) => this.ref.onFailure(b)

  skipRepeats: (eq?: Equivalence<B> | undefined) => Computed<R, E, B> = (eq = equals) =>
    Computed<R, E, B, never, never, B>(
      Versioned.transformFx<R, never, R, E, B, R, E, B, R, E, B>(
        this,
        skipRepeatsWith(eq)
      ),
      Effect.succeed
    )
}

// Empty, Never
// Map, Filter, + FilterMap
// Tap
// Scan, Loop
// Slice
// Time slicing
// Merging, Combining, Racing
// StartWith + EndWith
// flatMap et al.
// Scheduling
// multicast + hold

import type * as Option from "@effect/data/Option"
import type { Pipeable } from "@effect/data/Pipeable"
import type * as Cause from "@effect/io/Cause"
import type * as Effect from "@effect/io/Effect"
// import type { Scope } from "@effect/io/Scope"
import type { InternalEffect } from "@typed/fx/internal/effect-primitive"

export const TypeId = Symbol("@typed/fx/Fx")
export type TypeId = typeof TypeId

export interface Fx<R, E, A> extends Fx.Variance<R, E, A>, Pipeable {
  // TODO: All Fx should implement drain + observe

  // readonly drain: Effect.Effect<R | Scope, E, void>

  // readonly observe: <R2, E2, B>(
  //   f: (a: A) => Effect.Effect<R2, E2, B>
  // ) => Effect.Effect<R | R2 | Scope, E | E2, void>
}

export namespace Fx {
  export type Context<T> = [T] extends [Fx<infer R, infer _, infer __>] ? R : never
  export type Error<T> = [T] extends [Fx<any, infer E, any>] ? E : never
  export type Success<T> = [T] extends [Fx<any, any, infer A>] ? A : never

  export interface Variance<out R, out E, out A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }
}

declare module "@effect/data/Option" {
  export interface None<A> extends Fx<never, never, A> {}
  export interface Some<A> extends Fx<never, never, A> {}
}

declare module "@effect/data/Either" {
  export interface Left<E, A> extends Fx<never, E, A> {}
  export interface Right<E, A> extends Fx<never, E, A> {}
}

declare module "@effect/io/Cause" {
  export interface Empty extends Fx<never, never, never> {}
  export interface Fail<E> extends Fx<never, E, never> {}
  export interface Die extends Fx<never, never, never> {}
  export interface Interrupt extends Fx<never, never, never> {}
  export interface Annotated<E> extends Fx<never, E, never> {}
  export interface Sequential<E> extends Fx<never, E, never> {}
  export interface Parallel<E> extends Fx<never, E, never> {}
}

declare module "@effect/io/Exit" {
  export interface Failure<E, A> extends Fx<never, E, A> {}
  export interface Success<E, A> extends Fx<never, E, A> {}
}

declare module "@effect/io/Effect" {
  export interface Effect<R, E, A> extends Fx<R, E, A> {}
}

export type ExternalConstructor = InternalEffect | Cause.Cause<any>

/** @internal */
export enum OpCodes {
  OP_CONTINUE_WITH = "Fx/ContinueWith",
  OP_DROP_AFTER = "Fx/DropAfter",
  OP_DROP_UNTIL = "Fx/DropUntil",
  OP_DROP_WHILE = "Fx/DropWhile",
  OP_DURING = "Fx/During",
  OP_FILTER = "Fx/Filter",
  OP_FILTER_EFFECT = "Fx/FilterEffect",
  OP_FILTER_MAP = "Fx/FilterMap",
  OP_FILTER_MAP_EFFECT = "Fx/FilterMapEffect",
  OP_FLAT_MAP = "Fx/FlatMap",
  OP_FLAT_MAP_CAUSE = "Fx/FlatMapCause",
  OP_HOLD = "Fx/Hold",
  OP_LOOP = "Fx/Loop",
  OP_LOOP_EFFECT = "Fx/LoopEffect",
  OP_MAP = "Fx/Map",
  OP_MAP_EFFECT = "Fx/MapEffect",
  OP_MATCH_CAUSE = "Fx/MatchCause",
  OP_MULTICAST = "Fx/Multicast",
  OP_OR_ELSE = "Fx/OrElse",
  OP_SINCE = "Fx/Since",
  OP_SKIP_REPEATS = "Fx/SkipRepeats",
  OP_SLICE = "Fx/Slice",
  OP_SNAPSHOT = "Fx/Snapshot",
  OP_TAKE_UNTIL = "Fx/TakeUntil",
  OP_TAKE_WHILE = "Fx/TakeWhile",
  OP_TAP = "Fx/Tap",
  OP_TAP_EFFECT = "Fx/TapEffect",
  OP_UNTIL = "Fx/Until"
}

export const operatorOpCodes = [
  OpCodes.OP_CONTINUE_WITH,
  OpCodes.OP_DROP_AFTER,
  OpCodes.OP_DROP_UNTIL,
  OpCodes.OP_DROP_WHILE,
  OpCodes.OP_DURING,
  OpCodes.OP_FILTER,
  OpCodes.OP_FILTER_EFFECT,
  OpCodes.OP_FILTER_MAP,
  OpCodes.OP_FILTER_MAP_EFFECT,
  OpCodes.OP_FLAT_MAP,
  OpCodes.OP_FLAT_MAP_CAUSE,
  OpCodes.OP_HOLD,
  OpCodes.OP_LOOP,
  OpCodes.OP_LOOP_EFFECT,
  OpCodes.OP_MAP,
  OpCodes.OP_MAP_EFFECT,
  OpCodes.OP_MATCH_CAUSE,
  OpCodes.OP_MULTICAST,
  OpCodes.OP_OR_ELSE,
  OpCodes.OP_SINCE,
  OpCodes.OP_SKIP_REPEATS,
  OpCodes.OP_SLICE,
  OpCodes.OP_SNAPSHOT,
  OpCodes.OP_TAKE_UNTIL,
  OpCodes.OP_TAKE_WHILE,
  OpCodes.OP_TAP,
  OpCodes.OP_TAP_EFFECT,
  OpCodes.OP_UNTIL
]

/** @internal */
export type Op<Tag extends string, Body = {}> = Body & {
  readonly _tag: Tag
}

export type Operator =
  | ContinueWith
  | DropAfter
  | DropUntil
  | DropWhile
  | During
  | Filter
  | FilterEffect
  | FilterMap
  | FilterMapEffect
  | FlatMap
  | FlatMapCause
  | Hold
  | Loop
  | LoopEffect
  | Map
  | MapEffect
  | MatchCause
  | Multicast
  | OrElse
  | Since
  | SkipRepeats
  | Slice
  | Snapshot
  | TakeUntil
  | TakeWhile
  | Tap
  | TapEffect
  | Until

export interface Map extends
  Op<OpCodes.OP_MAP, {
    readonly i0: (a: any) => any
  }>
{}

export interface MapEffect extends
  Op<OpCodes.OP_MAP_EFFECT, {
    readonly i0: (a: any) => Effect.Effect<any, any, any>
  }>
{}

export interface Filter extends
  Op<OpCodes.OP_FILTER, {
    readonly i0: (a: any) => boolean
  }>
{}

export interface FilterEffect extends
  Op<OpCodes.OP_FILTER_EFFECT, {
    readonly i0: (a: any) => Effect.Effect<any, any, boolean>
  }>
{}

export interface FilterMap extends
  Op<OpCodes.OP_FILTER_MAP, {
    readonly i0: (a: any) => Option.Option<any>
  }>
{}

export interface FilterMapEffect extends
  Op<OpCodes.OP_FILTER_MAP_EFFECT, {
    readonly i0: (a: any) => Effect.Effect<any, any, Option.Option<any>>
  }>
{}

export interface Tap extends
  Op<OpCodes.OP_TAP, {
    readonly i0: (a: any) => void
  }>
{}

export interface TapEffect extends
  Op<OpCodes.OP_TAP_EFFECT, {
    readonly i0: (a: any) => Effect.Effect<any, any, void>
  }>
{}

export interface FlatMap extends
  Op<OpCodes.OP_FLAT_MAP, {
    readonly i0: (a: any) => Fx<any, any, any>
    readonly i1: FlattenStrategy
  }>
{}

export interface FlatMapCause extends
  Op<OpCodes.OP_FLAT_MAP_CAUSE, {
    readonly i0: (a: Cause.Cause<any>) => Fx<any, any, any>
    readonly i1: FlattenStrategy
  }>
{}

export interface MatchCause extends
  Op<OpCodes.OP_MATCH_CAUSE, {
    readonly i0: (a: Cause.Cause<any>) => Fx<any, any, any>
    readonly i1: (a: any) => Fx<any, any, any>
    readonly i2: FlattenStrategy
  }>
{}

export type FlattenStrategy = Unbounded | Bounded | Switch | Exhaust | ExhaustLatest

export interface Unbounded {
  readonly _tag: "Unbounded"
}

export const Unbounded: Unbounded = { _tag: "Unbounded" }

export interface Bounded {
  readonly _tag: "Bounded"
  readonly capacity: number
}

export const Bounded = (capacity: number): Bounded => ({ _tag: "Bounded", capacity })

export interface Switch {
  readonly _tag: "Switch"
}

export const Switch: Switch = { _tag: "Switch" }

export interface Exhaust {
  readonly _tag: "Exhaust"
}

export const Exhaust: Exhaust = { _tag: "Exhaust" }

export interface ExhaustLatest {
  readonly _tag: "ExhaustLatest"
}

export const ExhaustLatest: ExhaustLatest = { _tag: "ExhaustLatest" }

export interface OrElse extends
  Op<OpCodes.OP_OR_ELSE, {
    readonly i0: () => Fx<any, any, any>
  }>
{}

export interface ContinueWith extends
  Op<OpCodes.OP_CONTINUE_WITH, {
    readonly i0: () => Fx<any, any, any>
  }>
{}

export interface Slice extends
  Op<OpCodes.OP_SLICE, {
    readonly i0: number
    readonly i1: number
  }>
{}

export interface TakeUntil extends
  Op<OpCodes.OP_TAKE_UNTIL, {
    readonly i0: (a: any) => Effect.Effect<any, any, boolean>
  }>
{}

export interface TakeWhile extends
  Op<OpCodes.OP_TAKE_WHILE, {
    readonly i0: (a: any) => Effect.Effect<any, any, boolean>
  }>
{}

export interface DropUntil extends
  Op<OpCodes.OP_DROP_UNTIL, {
    readonly i0: (a: any) => Effect.Effect<any, any, boolean>
  }>
{}

export interface DropWhile extends
  Op<OpCodes.OP_DROP_WHILE, {
    readonly i0: (a: any) => Effect.Effect<any, any, boolean>
  }>
{}

export interface DropAfter extends
  Op<OpCodes.OP_DROP_AFTER, {
    readonly i0: (a: any) => Effect.Effect<any, any, boolean>
  }>
{}

export interface Snapshot extends
  Op<OpCodes.OP_SNAPSHOT, {
    readonly i0: Effect.Effect<any, any, any>
    readonly i1: (a: any, b: any) => Effect.Effect<any, any, any>
  }>
{}

export interface SkipRepeats extends
  Op<OpCodes.OP_SKIP_REPEATS, {
    readonly i0: (a: any, b: any) => boolean
  }>
{}

export interface Until extends
  Op<OpCodes.OP_UNTIL, {
    readonly i0: Fx<any, any, any>
  }>
{}

export interface Since extends
  Op<OpCodes.OP_SINCE, {
    readonly i0: Fx<any, any, any>
  }>
{}

export interface During extends
  Op<OpCodes.OP_DURING, {
    readonly i0: Fx<any, any, Fx<any, any, any>>
  }>
{}

export interface Loop extends
  Op<OpCodes.OP_LOOP, {
    readonly i0: (b: any, a: any) => readonly [any, any]
    readonly i1: any
  }>
{}

export interface LoopEffect extends
  Op<OpCodes.OP_LOOP_EFFECT, {
    readonly i0: (b: any, a: any) => Effect.Effect<any, any, readonly [any, any]>
    readonly i1: any
  }>
{}

export interface Multicast extends Op<OpCodes.OP_MULTICAST, {}> {}

export interface Hold extends Op<OpCodes.OP_HOLD, {}> {}

export type MergeStrategy = Unordered | Ordered | Switch

export interface Unordered {
  readonly _tag: "Unordered"
  readonly concurrency: number
}

export const Unordered = (concurrency: number): Unordered => ({ _tag: "Unordered", concurrency })

export interface Ordered {
  readonly _tag: "Ordered"
  readonly concurrency: number
}

export const Ordered = (concurrency: number): Ordered => ({ _tag: "Ordered", concurrency })

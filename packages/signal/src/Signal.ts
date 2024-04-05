import * as AsyncData from "@typed/async-data/AsyncData"
import * as Context from "@typed/context"
import type { Types } from "effect"
import { Effect, Effectable, Scope } from "effect"
import { Signals } from "./Signals.js"
import { hasProperty } from "effect/Predicate"
import { constant } from "effect/Function"

export const SignalTypeId = Symbol.for("@typed/signal/Signal")
export type SignalTypeId = typeof SignalTypeId

export interface Signal<A, E = never, R = never> extends Effect.Effect<A, E | AsyncData.Loading, R> {
  readonly [SignalTypeId]: Signal.Variance<A, E, R>
}

export namespace Signal {
  export type Any = Signal<any, any, any>

  export interface Variance<A, E, R> {
    readonly _A: Types.Invariant<A>
    readonly _E: Types.Invariant<E>
    readonly _R: Types.Covariant<R>
  }

  export const TaggedSignalTypeId = Symbol.for("@typed/signal/Tagged")
  export type TaggedSignalTypeId = typeof TaggedSignalTypeId

  export interface Tagged<I, A, E> extends Signal<A, E, I> { 
    readonly tag: Context.Tagged<I, Signal<A, E>>
  }
}

export function make<A, E, R>(
  initial: Effect.Effect<A, E, R>
): Effect.Effect<Signal<A, E>, never, R | Scope.Scope | Signals> {
  return Signals.withEffect((signals) => signals.make(initial))
}

export function get<A, E, R>(signal: Signal<A, E, R>): Effect.Effect<A, E | AsyncData.Loading, R> {
  return signal
}

export function getData<A, E, R>(signal: Signal<A, E, R>): Effect.Effect<AsyncData.AsyncData<A, E>, never, Signals | R> {
  return Signals.withEffect((signals) => signals.getData(signal))
}

export function modify<A, E, R, B>(
  signal: Signal<A, E, R>,
  f: (a: A) => readonly [B, A]
): Effect.Effect<B, E | AsyncData.Loading, R | Signals> {
  return Signals.withEffect((signals) => signals.modify(signal, f))
}

export function modifyEffect<A, E, R, B, E2, R2>(
  signal: Signal<A, E, R>,
  f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
): Effect.Effect<B, E | E2 | AsyncData.Loading, R | R2 | Signals> {
  return Signals.withEffect((signals) => signals.modifyEffect(signal, f))
}

export function modifyData<A, E, R, B>(
  signal: Signal<A, E, R>,
  f: (data: AsyncData.AsyncData<E, A>) => readonly [B, AsyncData.AsyncData<E, A>]
): Effect.Effect<B, never, R | Signals> {
  return Signals.withEffect((signals) => signals.modifyData(signal, f))
}

export function modifyDataEffect<A, E, R, B, E2, R2>(
  signal: Signal<A, E, R>,
  f: (data: AsyncData.AsyncData<E, A>) => Effect.Effect<readonly [B, AsyncData.AsyncData<E, A>], E2, R2>
): Effect.Effect<B, E2, R | R2 | Signals> {
  return Signals.withEffect((signals) => signals.modifyDataEffect(signal, f))
}

export function isSignal(u: unknown): u is Signal.Any {
  return hasProperty(u, SignalTypeId)
}

export function isTaggedSignal(u: unknown): u is Signal.Tagged<any, any, any> {
  return hasProperty(u, Signal.TaggedSignalTypeId)
}

export function tagged<A, E>(): {
  <const I extends Context.IdentifierConstructor<any>>(
    identifier: (id: typeof Context.id) => I
  ): Signal.Tagged<Context.IdentifierOf<I>, A, E>

  <const I>(identifier: I): Signal.Tagged<Context.IdentifierOf<I>, A, E>
} {
  return <I extends Context.IdentifierInput<any>>(identifier: I): Signal.Tagged<I, A, E> =>
    new TaggedSignal(identifier)
}

const Variance: Signal.Variance<any, any, any> = {
  _A: (_) => _,
  _E: (_) => _,
  _R: (_) => _,
}

class TaggedSignal<I, A, E> extends Effectable.StructuralClass<A, E | AsyncData.Loading, I> implements Signal.Tagged<I, A, E> {
  readonly [SignalTypeId]: Signal.Variance<A, E, I> = Variance
  readonly [Signal.TaggedSignalTypeId] = Signal.TaggedSignalTypeId
  readonly tag: Context.Tagged<I, Signal<A, E>>
  readonly commit: () => Effect.Effect<A, E | AsyncData.Loading, I>

  constructor(identifier: Context.IdentifierInput<I>) {
    super()
    this.tag = Context.Tagged(identifier as any)
    this.commit = constant(this.tag.withEffect(s => s))
  }
}

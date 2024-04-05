import * as AsyncData from "@typed/async-data/AsyncData"
import * as Context from "@typed/context"
import type { Scope, Types } from "effect"
import { Effect, Effectable, Layer } from "effect"
import type { Cause } from "effect/Cause"
import { constant, dual } from "effect/Function"
import { hasProperty } from "effect/Predicate"
import type { Concurrency } from "effect/Types"
import { ComputedImpl } from "./internal/computed.js"
import type { ComputedTypeId } from "./internal/type-id.js"
import { SignalTypeId } from "./internal/type-id.js"
import { Signals } from "./Signals.js"

export interface Signal<A, E = never, R = never> extends Effect.Effect<A, E | AsyncData.Loading, R> {
  readonly [SignalTypeId]: Signal.Variance<A, E, R>
  /* Get is the effect interface */

  // Sync modify
  modify<B>(f: (a: A) => readonly [B, A]): Effect.Effect<B, E | AsyncData.Loading, R>
  set(a: A): Effect.Effect<A, never, R>

  // Effect modify
  modifyEffect<B, E2, R2>(
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, E | E2 | AsyncData.Loading, R | R2>

  // Underlying AsyncData state

  data: Effect.Effect<AsyncData.AsyncData<A, E>, never, R>

  runUpdates: <B, E2, R2>(
    f: (params: {
      get: Effect.Effect<AsyncData.AsyncData<A, E>>
      set: (a: AsyncData.AsyncData<A, E>) => Effect.Effect<AsyncData.AsyncData<A, E>>
    }) => Effect.Effect<B, E2, R2>
  ) => Effect.Effect<B, E | E2 | AsyncData.Loading, R | R2>
}

export namespace Signal {
  export type Any = Signal<any, any, any>

  export interface Variance<A, E, R> {
    readonly _A: Types.Invariant<A>
    readonly _E: Types.Invariant<E>
    readonly _R: Types.Covariant<R>
  }

  export type Context<T> = T extends Signal<infer _A, infer _E, infer R> ? R : never

  export type Error<T> = T extends Signal<infer _A, infer E, infer _R> ? E : never

  export type Success<T> = T extends Signal<infer A, infer _E, infer _R> ? A : never

  export interface Tagged<I, A, E> extends Signal<A, E, I> {
    readonly tag: Context.Tagged<I, Signal<A, E>>
    readonly make: <R2>(initial: Effect.Effect<A, E, R2>) => Layer.Layer<I, never, R2 | Signals>
    readonly provide: <R2>(initial: Effect.Effect<A, E, R2>) => <B, E2, R3>(
      effect: Effect.Effect<B, E2, R3>
    ) => Effect.Effect<B, E2, R2 | Signals | Exclude<R3, I>>
  }
}

export function make<A, E, R>(
  initial: Effect.Effect<A, E, R>
): Effect.Effect<Signal<A, E>, never, R | Scope.Scope | Signals> {
  return Signals.withEffect((signals) => signals.make(initial))
}

export const modify: {
  <A, B>(f: (a: A) => readonly [B, A]): <E, R>(signal: Signal<A, E, R>) => Effect.Effect<B, AsyncData.Loading | E, R>

  <A, E, R, B>(signal: Signal<A, E, R>, f: (a: A) => readonly [B, A]): Effect.Effect<B, AsyncData.Loading | E, R>
} = dual(2, function modify<A, E, R, B>(
  signal: Signal<A, E, R>,
  f: (a: A) => readonly [B, A]
): Effect.Effect<B, E | AsyncData.Loading, R> {
  return signal.modify(f)
})

export const modifyEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): <E, R>(signal: Signal<A, E, R>) => Effect.Effect<B, E | E2 | AsyncData.Loading, R>

  <A, E, R, B, E2, R2>(
    signal: Signal<A, E, R>,
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, AsyncData.Loading | E | E2, R | R2>
} = dual(2, function modifyEffect<A, E, R, B, E2, R2>(
  signal: Signal<A, E, R>,
  f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
): Effect.Effect<B, E | E2 | AsyncData.Loading, R | R2> {
  return signal.modifyEffect(f)
})

export function data<A, E, R>(
  signal: Signal<A, E, R>
): Effect.Effect<AsyncData.AsyncData<A, E>, never, R> {
  return signal.data
}

export const runUpdates: {
  <A, E, B, E2, R2>(
    f: (
      params: {
        get: Effect.Effect<AsyncData.AsyncData<A, E>, never, never>
        set: (a: AsyncData.AsyncData<A, E>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, never>
      }
    ) => Effect.Effect<B, E2, R2>
  ): <E, R>(signal: Signal<A, E, R>) => Effect.Effect<B, E | E2 | AsyncData.Loading, R>

  <A, E, R, B, E2, R2>(
    signal: Signal<A, E, R>,
    f: (
      params: {
        get: Effect.Effect<AsyncData.AsyncData<A, E>, never, never>
        set: (a: AsyncData.AsyncData<A, E>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, never>
      }
    ) => Effect.Effect<B, E2, R2>
  ): Effect.Effect<B, AsyncData.Loading | E | E2, R | R2>
} = dual(2, function runUpdates<A, E, R, B, E2, R2>(
  signal: Signal<A, E, R>,
  f: (params: {
    get: Effect.Effect<AsyncData.AsyncData<A, E>>
    set: (a: AsyncData.AsyncData<A, E>) => Effect.Effect<AsyncData.AsyncData<A, E>>
  }) => Effect.Effect<B, E2, R2>
): Effect.Effect<B, E | E2 | AsyncData.Loading, R | R2> {
  return signal.runUpdates(f)
})

export const update: {
  <A>(f: (a: A) => A): <E, R>(signal: Signal<A, E, R>) => Effect.Effect<A, AsyncData.Loading | E, R>
  <A, E, R>(signal: Signal<A, E, R>, f: (a: A) => A): Effect.Effect<A, AsyncData.Loading | E, R>
} = dual(2, function update<A, E, R>(
  signal: Signal<A, E, R>,
  f: (a: A) => A
): Effect.Effect<A, E | AsyncData.Loading, R> {
  return modify(signal, (a: A) => {
    const a2 = f(a)
    return [a2, a2]
  })
})

export const updateEffect: {
  <A, E2, R2>(
    f: (a: A) => Effect.Effect<A, E2, R2>
  ): <E, R>(signal: Signal<A, E, R>) => Effect.Effect<A, AsyncData.Loading | E | E2, R | R2>
  <A, E, R, E2, R2>(
    signal: Signal<A, E, R>,
    f: (a: A) => Effect.Effect<A, E2, R2>
  ): Effect.Effect<A, AsyncData.Loading | E | E2, R | R2>
} = dual(2, function updateEffect<A, E, R, E2, R2>(
  signal: Signal<A, E, R>,
  f: (a: A) => Effect.Effect<A, E2, R2>
): Effect.Effect<A, E | E2 | AsyncData.Loading, R | R2> {
  return modifyEffect(signal, (a: A) => Effect.map(f(a), (a2) => [a2, a2]))
})

export function isSignal(u: unknown): u is Signal.Any {
  return hasProperty(u, SignalTypeId)
}

export function isTaggedSignal(u: unknown): u is Signal.Tagged<any, any, any> {
  return isSignal(u) && hasProperty(u, "tag") && hasProperty(u, "make")
}

export function tagged<A, E = never>(): {
  <const I extends Context.IdentifierConstructor<any>>(
    identifier: (id: typeof Context.id) => I
  ): Signal.Tagged<Context.IdentifierOf<I>, A, E>

  <const I>(identifier: I): Signal.Tagged<Context.IdentifierOf<I>, A, E>
} {
  return <I extends Context.IdentifierInput<any>>(identifier: I): Signal.Tagged<I, A, E> => new TaggedSignal(identifier)
}

const Variance: Signal.Variance<any, any, any> = {
  _A: (_) => _,
  _E: (_) => _,
  _R: (_) => _
}

class TaggedSignal<I, A, E> extends Effectable.StructuralClass<A, E | AsyncData.Loading, I>
  implements Signal.Tagged<I, A, E>
{
  readonly [SignalTypeId]: Signal.Variance<A, E, I> = Variance
  readonly tag: Context.Tagged<I, Signal<A, E>>
  readonly commit: () => Effect.Effect<A, E | AsyncData.Loading, I>

  constructor(identifier: Context.IdentifierInput<I>) {
    super()
    this.tag = Context.Tagged(identifier as any)
    this.commit = constant(Effect.flatten(this.tag))
  }

  modify<B>(f: (a: A) => readonly [B, A]) {
    return this.tag.withEffect((signal) => signal.modify(f))
  }

  modifyEffect<B, E2, R2>(
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ) {
    return this.tag.withEffect((signal) => signal.modifyEffect(f))
  }

  set(a: A): Effect.Effect<A, never, I> {
    return this.tag.withEffect((signal) => signal.set(a))
  }

  get data() {
    return this.tag.withEffect((signal) => signal.data)
  }

  runUpdates<B, E2, R2>(
    f: (params: {
      get: Effect.Effect<AsyncData.AsyncData<A, E>>
      set: (a: AsyncData.AsyncData<A, E>) => Effect.Effect<AsyncData.AsyncData<A, E>>
    }) => Effect.Effect<B, E2, R2>
  ) {
    return this.tag.withEffect((signal) => signal.runUpdates(f))
  }

  make<R2>(initial: Effect.Effect<A, E, R2>) {
    return this.tag.scoped(make(initial))
  }

  provide<R2>(initial: Effect.Effect<A, E, R2>) {
    return Effect.provide(this.make(initial))
  }
}

export interface Computed<A, E = never, R = never> extends Effect.Effect<A, E | AsyncData.Loading, R | Signals> {
  readonly [ComputedTypeId]: Computed.Variance<A, E, R>
  readonly effect: Effect.Effect<A, E, R>
  readonly priority: number
}

export namespace Computed {
  export type Any = Computed<any, any, any>

  export interface Variance<A, E, R> {
    readonly _A: Types.Covariant<A>
    readonly _E: Types.Covariant<E>
    readonly _R: Types.Covariant<R>
  }
}

export interface ComputedOptions {
  readonly priority: number
}

export function compute<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options?: Partial<ComputedOptions>
): Computed<A, Exclude<E, AsyncData.Loading>, Exclude<R, Signals>> {
  return new ComputedImpl(effect, options?.priority) as any
}

export const fail: {
  <E>(e: E): <A, R>(signal: Signal<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, AsyncData.Loading | E, R>

  <A, E, R>(signal: Signal<A, E, R>, e: E): Effect.Effect<AsyncData.AsyncData<A, E>, AsyncData.Loading | E, R>
} = dual(2, function fail<A, E, R>(signal: Signal<A, E, R>, e: E) {
  return runUpdates(signal, ({ set }) => set(AsyncData.fail(e)))
})

export const failCause: {
  <E>(
    cause: Cause<E>
  ): <A, R>(signal: Signal<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, AsyncData.Loading | E, R>

  <A, E, R>(
    signal: Signal<A, E, R>,
    cause: Cause<E>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, AsyncData.Loading | E, R>
} = dual(2, function failCause<A, E, R>(signal: Signal<A, E, R>, cause: Cause<E>) {
  return runUpdates(signal, ({ set }) => set(AsyncData.failCause(cause)))
})

export function launch<A, E, R>(
  computed: Computed<A, E, R>
): Effect.Effect<never, never, R | Signals> {
  return Layer.launch(Layer.scopedDiscard(Effect.ignoreLogged(computed)))
}

const isEffectDataFirst = (args: IArguments) => Effect.isEffect(args[0])

export const map: {
  <A, B>(
    f: (a: A) => B,
    options?: Partial<ComputedOptions>
  ): <E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Computed<B, Exclude<E, AsyncData.Loading>, Exclude<R, Signals>>

  <A, E, R, B>(
    effect: Effect.Effect<A, E, R>,
    f: (a: NoInfer<A>) => B,
    options?: Partial<ComputedOptions>
  ): Computed<B, Exclude<E, AsyncData.Loading>, Exclude<R, Signals>>
} = dual(isEffectDataFirst, function map<A, E, R, B>(
  effect: Effect.Effect<A, E, R>,
  f: (a: A) => B,
  options?: Partial<ComputedOptions>
): Computed<B, Exclude<E, AsyncData.Loading>, Exclude<R, Signals>> {
  return compute(Effect.map(effect, f), options)
})

export const mapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    options?: Partial<ComputedOptions>
  ): <E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Computed<B, E | E2, R | R2>

  <A, E, R, B, E2, R2>(
    effect: Effect.Effect<A, E, R>,
    f: (a: NoInfer<A>) => Effect.Effect<B, E2, R2>,
    options?: Partial<ComputedOptions>
  ): Computed<B, E | E2, R | R2>
} = dual(isEffectDataFirst, function mapEffect<A, E, R, B, E2, R2>(
  effect: Effect.Effect<A, E, R>,
  f: (a: NoInfer<A>) => Effect.Effect<B, E2, R2>,
  options?: Partial<ComputedOptions>
): Computed<B, E | E2, R | R2> {
  return compute(Effect.flatMap(effect, f), options)
})

const is2EffectDataFirst = (args: IArguments) => Effect.isEffect(args[0]) && Effect.isEffect(args[1])

export const zipWith: {
  <A, B, E2, R2, C>(
    signalB: Effect.Effect<B, E2, R2>,
    f: (a: A, b: B) => C,
    options?: Partial<ComputedOptions>
  ): <E, R>(signalA: Effect.Effect<A, E, R>) => Computed<
    C,
    Exclude<E | E2, AsyncData.Loading>,
    Exclude<R | R2, Signals>
  >

  <A, E, R, B, E2, R2, C>(
    signalA: Effect.Effect<A, E, R>,
    signalB: Effect.Effect<B, E2, R2>,
    f: (a: A, b: B) => C,
    options?: Partial<ComputedOptions>
  ): Computed<
    C,
    Exclude<E | E2, AsyncData.Loading>,
    Exclude<R | R2, Signals>
  >
} = dual(is2EffectDataFirst, function zipWith<A, E, R, B, E2, R2, C>(
  signalA: Effect.Effect<A, E, R>,
  signalB: Effect.Effect<B, E2, R2>,
  f: (a: A, b: B) => C,
  options?: Partial<ComputedOptions>
): Computed<C, Exclude<E | E2, AsyncData.Loading>, Exclude<R | R2, Signals>> {
  return compute(Effect.zipWith(signalA, signalB, f), options)
})

export const zip: {
  <A, B, E2, R2>(
    signalB: Effect.Effect<B, E2, R2>,
    options?: Partial<ComputedOptions>
  ): <E, R>(signalA: Effect.Effect<A, E, R>) => Computed<
    readonly [A, B],
    Exclude<E | E2, AsyncData.Loading>,
    Exclude<R | R2, Signals>
  >

  <A, E, R, B, E2, R2>(
    signalA: Effect.Effect<A, E, R>,
    signalB: Effect.Effect<B, E2, R2>,
    options?: Partial<ComputedOptions>
  ): Computed<readonly [A, B], Exclude<E | E2, AsyncData.Loading>, Exclude<R | R2, Signals>>
} = dual(is2EffectDataFirst, function zip<A, E, R, B, E2, R2>(
  signalA: Effect.Effect<A, E, R>,
  signalB: Effect.Effect<B, E2, R2>,
  options?: Partial<ComputedOptions>
): Computed<readonly [A, B], Exclude<E | E2, AsyncData.Loading>, Exclude<R | R2, Signals>> {
  return compute(Effect.zip(signalA, signalB), options)
})

export function all<
  const Arg extends Iterable<Effect.Effect<any, any, any>> | Record<string, Effect.Effect<any, any, any>>,
  O extends {
    readonly concurrency?: Concurrency | undefined
    readonly batching?: boolean | "inherit" | undefined
    readonly discard?: boolean | undefined
    readonly mode?: "default" | "validate" | "either" | undefined
  } & Partial<ComputedOptions>
>(arg: Arg, options?: O): Computed<
  Effect.Effect.Success<Effect.All.Return<Arg, O>>,
  Exclude<Effect.Effect.Error<Effect.All.Return<Arg, O>>, AsyncData.Loading>,
  Exclude<Effect.Effect.Context<Effect.All.Return<Arg, O>>, Signals>
> {
  return compute(Effect.all(arg, options) as any, options) as any
}

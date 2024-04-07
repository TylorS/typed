import * as AsyncData from "@typed/async-data/AsyncData"
import * as Context from "@typed/context"
import type { Scope, Types } from "effect"
import { Effect, Effectable, Layer } from "effect"
import type { Cause } from "effect/Cause"
import { constant, dual } from "effect/Function"
import { hasProperty } from "effect/Predicate"
import type { Concurrency } from "effect/Types"
import { unify } from "effect/Unify"
import { ComputedImpl } from "./internal/computed.js"
import { ComputedTypeId, SignalTypeId } from "./internal/type-id.js"
import { Signals } from "./Signals.js"

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export namespace Signal {
  /**
   * @since 1.0.0
   */
  export type Any = Signal<any, any, any>

  /**
   * @since 1.0.0
   */
  export interface Variance<A, E, R> {
    readonly _A: Types.Invariant<A>
    readonly _E: Types.Invariant<E>
    readonly _R: Types.Covariant<R>
  }

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends Signal<infer _A, infer _E, infer R> ? R : never

  /**
   * @since 1.0.0
   */
  export type Error<T> = T extends Signal<infer _A, infer E, infer _R> ? E : never

  /**
   * @since 1.0.0
   */
  export type Success<T> = T extends Signal<infer A, infer _E, infer _R> ? A : never

  /**
   * @since 1.0.0
   */
  export interface Tagged<I, A, E> extends Signal<A, E, I> {
    readonly tag: Context.Tagged<I, Signal<A, E>>
    readonly make: <R2>(
      initial: Effect.Effect<A, E, R2>,
      options?: Partial<SignalOptions>
    ) => Layer.Layer<I, never, R2 | Signals>
    readonly provide: <R2>(initial: Effect.Effect<A, E, R2>) => <B, E2, R3>(
      effect: Effect.Effect<B, E2, R3>
    ) => Effect.Effect<B, E2, R2 | Signals | Exclude<R3, I>>
  }
}

/**
 * @since 1.0.0
 */
export interface SignalOptions {
  readonly priority: number
}

/**
 * @since 1.0.0
 */
export function make<A, E = never, R = never>(
  initial: Effect.Effect<A, E, R>,
  options?: Partial<SignalOptions>
): Effect.Effect<Signal<A, E>, never, R | Scope.Scope | Signals> {
  return Signals.withEffect((signals) => signals.make(initial, options))
}

/**
 * @since 1.0.0
 */
export const modify: {
  <A, B>(f: (a: A) => readonly [B, A]): <E, R>(signal: Signal<A, E, R>) => Effect.Effect<B, AsyncData.Loading | E, R>

  <A, E, R, B>(signal: Signal<A, E, R>, f: (a: A) => readonly [B, A]): Effect.Effect<B, AsyncData.Loading | E, R>
} = dual(2, function modify<A, E, R, B>(
  signal: Signal<A, E, R>,
  f: (a: A) => readonly [B, A]
): Effect.Effect<B, E | AsyncData.Loading, R> {
  return signal.modify(f)
})

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export function data<A, E, R>(
  signal: Signal<A, E, R>
): Effect.Effect<AsyncData.AsyncData<A, E>, never, R> {
  return signal.data
}

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export function isSignal(u: unknown): u is Signal.Any {
  return hasProperty(u, SignalTypeId)
}

/**
 * @since 1.0.0
 */
export function isTaggedSignal(u: unknown): u is Signal.Tagged<any, any, any> {
  return isSignal(u) && hasProperty(u, "tag") && hasProperty(u, "make")
}

/**
 * @since 1.0.0
 */
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

  make<R2>(initial: Effect.Effect<A, E, R2>, options?: Partial<SignalOptions>) {
    return this.tag.scoped(make(initial, options))
  }

  provide<R2>(initial: Effect.Effect<A, E, R2>) {
    return Effect.provide(this.make(initial))
  }
}

/**
 * @since 1.0.0
 */
export interface Computed<A, E = never, R = never> extends Effect.Effect<A, E, R | Signals> {
  readonly [ComputedTypeId]: Computed.Variance<A, E, R>
  readonly effect: Effect.Effect<A, E, R>
}

/**
 * @since 1.0.0
 */
export namespace Computed {
  /**
   * @since 1.0.0
   */
  export type Any = Computed<any, any, any>

  /**
   * @since 1.0.0
   */
  export interface Variance<A, E, R> {
    readonly _A: Types.Covariant<A>
    readonly _E: Types.Covariant<E>
    readonly _R: Types.Covariant<R>
  }
}

/**
 * @since 1.0.0
 */
export function compute<A, E, R>(
  effect: Effect.Effect<A, E, R>
): Computed<A, E, Exclude<R, Signals>> {
  return new ComputedImpl(effect) as any
}

/**
 * @since 1.0.0
 */
export function isComputed(u: unknown): u is Computed.Any {
  return hasProperty(u, ComputedTypeId)
}

/**
 * @since 1.0.0
 */
export const fail: {
  <E>(e: E): <A, R>(signal: Signal<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, AsyncData.Loading | E, R>

  <A, E, R>(signal: Signal<A, E, R>, e: E): Effect.Effect<AsyncData.AsyncData<A, E>, AsyncData.Loading | E, R>
} = dual(2, function fail<A, E, R>(signal: Signal<A, E, R>, e: E) {
  return runUpdates(signal, ({ set }) => set(AsyncData.fail(e)))
})

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export function launch<A, E, R>(
  computed: Computed<A, E, R>
): Effect.Effect<never, never, R | Signals> {
  return Layer.launch(Layer.scopedDiscard(Effect.ignoreLogged(computed)))
}

/**
 * @since 1.0.0
 */
export const map: {
  <A, B>(
    f: (a: A) => B
  ): <E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Computed<B, E, Exclude<R, Signals>>

  <A, E, R, B>(
    effect: Effect.Effect<A, E, R>,
    f: (a: NoInfer<A>) => B
  ): Computed<B, E, Exclude<R, Signals>>
} = dual(2, function map<A, E, R, B>(
  effect: Effect.Effect<A, E, R>,
  f: (a: A) => B
): Computed<B, E, Exclude<R, Signals>> {
  return compute(Effect.map(effect, f))
})

/**
 * @since 1.0.0
 */
export const mapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): <E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Computed<B, E | E2, R | R2>

  <A, E, R, B, E2, R2>(
    effect: Effect.Effect<A, E, R>,
    f: (a: NoInfer<A>) => Effect.Effect<B, E2, R2>
  ): Computed<B, E | E2, R | R2>
} = dual(2, function mapEffect<A, E, R, B, E2, R2>(
  effect: Effect.Effect<A, E, R>,
  f: (a: NoInfer<A>) => Effect.Effect<B, E2, R2>
): Computed<B, E | E2, R | R2> {
  return compute(Effect.flatMap(effect, f))
})

/**
 * @since 1.0.0
 */
export const tap: {
  <A, B, E2 = never, R2 = never>(
    f: (a: A) => B | Effect.Effect<B, E2, R2>
  ): <E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Computed<A, E | E2, R | R2>

  <A, E, R, B, E2 = never, R2 = never>(
    effect: Effect.Effect<A, E, R>,
    f: (a: NoInfer<A>) => B | Effect.Effect<B, E2, R2>
  ): Computed<A, E | E2, R | R2>
} = dual(2, function tap<A, E, R, B, E2 = never, R2 = never>(
  effect: Effect.Effect<A, E, R>,
  f: (a: NoInfer<A>) => Effect.Effect<B, E2, R2>
): Computed<A, E | E2, R | R2> {
  return compute(Effect.tap(effect, f))
})

/**
 * @since 1.0.0
 */
export const zipWith: {
  <A, B, E2, R2, C>(
    signalB: Effect.Effect<B, E2, R2>,
    f: (a: A, b: B) => C
  ): <E, R>(signalA: Effect.Effect<A, E, R>) => Computed<
    C,
    E | E2,
    Exclude<R | R2, Signals>
  >

  <A, E, R, B, E2, R2, C>(
    signalA: Effect.Effect<A, E, R>,
    signalB: Effect.Effect<B, E2, R2>,
    f: (a: A, b: B) => C
  ): Computed<
    C,
    E | E2,
    Exclude<R | R2, Signals>
  >
} = dual(3, function zipWith<A, E, R, B, E2, R2, C>(
  signalA: Effect.Effect<A, E, R>,
  signalB: Effect.Effect<B, E2, R2>,
  f: (a: A, b: B) => C
): Computed<C, E | E2, Exclude<R | R2, Signals>> {
  return compute(Effect.zipWith(signalA, signalB, f))
})

/**
 * @since 1.0.0
 */
export const zip: {
  <A, B, E2, R2>(
    signalB: Effect.Effect<B, E2, R2>
  ): <E, R>(signalA: Effect.Effect<A, E, R>) => Computed<
    readonly [A, B],
    E | E2,
    Exclude<R | R2, Signals>
  >
  <A, E, R, B, E2, R2>(
    signalA: Effect.Effect<A, E, R>,
    signalB: Effect.Effect<B, E2, R2>
  ): Computed<readonly [A, B], E | E2, Exclude<R | R2, Signals>>
} = dual(2, function zip<A, E, R, B, E2, R2>(
  signalA: Effect.Effect<A, E, R>,
  signalB: Effect.Effect<B, E2, R2>
): Computed<readonly [A, B], E | E2, Exclude<R | R2, Signals>> {
  return compute(Effect.zip(signalA, signalB))
})

/**
 * @since 1.0.0
 */
export function all<
  const Arg extends Iterable<Effect.Effect<any, any, any>> | Record<string, Effect.Effect<any, any, any>>,
  O extends {
    readonly concurrency?: Concurrency | undefined
    readonly batching?: boolean | "inherit" | undefined
    readonly discard?: boolean | undefined
    readonly mode?: "default" | "validate" | "either" | undefined
  }
>(arg: Arg, options?: O): Computed<
  Effect.Effect.Success<Effect.All.Return<Arg, O>>,
  Effect.Effect.Error<Effect.All.Return<Arg, O>>,
  Exclude<Effect.Effect.Context<Effect.All.Return<Arg, O>>, Signals>
> {
  return compute(Effect.all(arg, options) as any) as any
}

/**
 * Recovers from all causes
 *
 * @since 1.0.0
 * @category error handling
 */
export const catchAllCause: {
  <E, B, E2, R2>(
    f: (cause: Cause<E>) => Effect.Effect<B, E2, R2>
  ): <A, R>(signal: Effect.Effect<A, E, R>) => Computed<A | B, E2, Exclude<R, Signals> | Exclude<R2, Signals>>

  <A, E, R, B, E2, R2>(
    signal: Effect.Effect<A, E, R>,
    f: (cause: Cause<E>) => Effect.Effect<B, E2, R2>
  ): Computed<A | B, E2, Exclude<R, Signals> | Exclude<R2, Signals>>
} = dual(2, function catchAllCause<A, E, R, B, E2, R2>(
  signal: Effect.Effect<A, E, R>,
  f: (cause: Cause<E>) => Effect.Effect<B, E2, R2>
): Computed<A | B, E2, Exclude<R | R2, Signals>> {
  return compute(Effect.catchAllCause(signal, f))
})

/**
 * Recovers from all errors
 *
 * @since 1.0.0
 * @category error handling
 */
export const catchAll: {
  <E, B, E2, R2>(
    f: (error: E) => Effect.Effect<B, E2, R2>
  ): <A, R>(signal: Effect.Effect<A, E, R>) => Computed<A | B, E2, Exclude<R, Signals> | Exclude<R2, Signals>>

  <A, E, R, B, E2, R2>(
    signal: Effect.Effect<A, E, R>,
    f: (error: E) => Effect.Effect<B, E2, R2>
  ): Computed<A | B, E2, Exclude<R, Signals> | Exclude<R2, Signals>>
} = dual(2, function catchAll<A, E, R, B, E2, R2>(
  signal: Effect.Effect<A, E, R>,
  f: (error: E) => Effect.Effect<B, E2, R2>
): Computed<A | B, E2, Exclude<R | R2, Signals>> {
  return compute(Effect.catchAll(signal, f))
})

/**
 * Recovers from the specified tagged error.
 *
 * @since 1.0.0
 * @category error handling
 */
export const catchTag: {
  <K extends E extends { _tag: string } ? E["_tag"] : never, E, A1, E1, R1>(
    k: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<A1, E1, R1>
  ): <A, R>(
    self: Effect.Effect<A, E, R>
  ) => Computed<A1 | A, Exclude<E1 | Exclude<E, { _tag: K }>, AsyncData.Loading>, Exclude<R1 | R, Signals>>
  <A, E, R, K extends E extends { _tag: string } ? E["_tag"] : never, R1, E1, A1>(
    self: Effect.Effect<A, E, R>,
    k: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<A1, E1, R1>
  ): Computed<A | A1, Exclude<E1 | Exclude<E, { _tag: K }>, AsyncData.Loading>, Exclude<R | R1, Signals>>
} = dual(
  3,
  function catchTag<A, E, R, K extends E extends { _tag: string } ? E["_tag"] : never, R1, E1, A1>(
    self: Effect.Effect<A, E, R>,
    k: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<A1, E1, R1>
  ) {
    return compute(Effect.catchTag(self, k, f))
  }
)

/**
 * Recovers from the specified tagged errors.
 *
 * @since 1.0.0
 * @category error handling
 */
export const catchTags: {
  <
    E,
    Cases extends
      & {
        [K in Extract<E, { _tag: string }>["_tag"]]+?:
          ((error: Extract<E, { _tag: K }>) => Effect.Effect<any, any, any>)
      }
      & (unknown extends E ? {} : { [K in Exclude<keyof Cases, Extract<E, { _tag: string }>["_tag"]>]: never })
  >(
    cases: Cases
  ): <A, R>(
    self: Effect.Effect<A, E, R>
  ) => Computed<
    | A
    | {
      [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<infer A, any, any> ? A : never
    }[keyof Cases],
    | Exclude<E, { _tag: keyof Cases }>
    | {
      [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never
    }[keyof Cases],
    | R
    | {
      [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never
    }[keyof Cases]
  >
  <
    R,
    E,
    A,
    Cases extends
      & {
        [K in Extract<E, { _tag: string }>["_tag"]]+?:
          ((error: Extract<E, { _tag: K }>) => Effect.Effect<any, any, any>)
      }
      & (unknown extends E ? {} : { [K in Exclude<keyof Cases, Extract<E, { _tag: string }>["_tag"]>]: never })
  >(
    self: Effect.Effect<A, E, R>,
    cases: Cases
  ): Computed<
    | A
    | {
      [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<infer A, any, any> ? A : never
    }[keyof Cases],
    | Exclude<E, { _tag: keyof Cases }>
    | {
      [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never
    }[keyof Cases],
    | R
    | {
      [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never
    }[keyof Cases]
  >
} = dual(2, function catchTags<
  A,
  E,
  R,
  Cases extends
    & {
      [K in Extract<E, { _tag: string }>["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => Effect.Effect<any, any, any>)
    }
    & (unknown extends E ? {} : { [K in Exclude<keyof Cases, Extract<E, { _tag: string }>["_tag"]>]: never })
>(
  self: Effect.Effect<A, E, R>,
  cases: Cases
) {
  return compute(Effect.catchTags(self, cases))
})

/**
 * Recover from AsyncData.Loading error
 * @since 1.0.0
 */
export const catchLoading: {
  <A1, E1, R1>(
    f: (loading: AsyncData.Loading) => Effect.Effect<A1, E1, R1>
  ): <A, E, R>(
    signal: Effect.Effect<A, E, R>
  ) => Computed<A | A1, E1 | Exclude<E, AsyncData.Loading>, Exclude<R | R1, Signals>>

  <A, E, R, A1, E1, R1>(
    signal: Effect.Effect<A, E, R>,
    f: (loading: AsyncData.Loading) => Effect.Effect<A1, E1, R1>
  ): Computed<A | A1, E1 | Exclude<E, AsyncData.Loading>, Exclude<R | R1, Signals>>
} = dual(2, function catchLoading<A, E, R, A1, E1, R1>(
  signal: Effect.Effect<A, E, R>,
  f: (loading: AsyncData.Loading) => Effect.Effect<A1, E1, R1>
) {
  return catchAll(
    signal,
    unify((error) =>
      AsyncData.isAsyncData<A, E>(error) && AsyncData.isLoading(error)
        ? f(error)
        : Effect.fail(error as Exclude<E, AsyncData.Loading>)
    )
  )
})

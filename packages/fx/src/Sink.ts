/**
 * Sink is a data structure which can be used to consume values from a stream.
 * @since 1.20.0
 */

import * as C from "@typed/context"
import * as Cause from "effect/Cause"
import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type * as Predicate from "effect/Predicate"
import type * as Tracer from "effect/Tracer"
import { type Bounds } from "./internal/bounds.js"

/**
 * Sink is a data structure which can be used to consume values from a stream.
 * @since 1.20.0
 */
export interface Sink<in A, in E = never, out R = never> {
  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R>
  onSuccess(value: A): Effect.Effect<unknown, never, R>
}

/**
 * @since 1.20.0
 */
export namespace Sink {
  /**
   * @since 1.20.0
   */
  export type Context<T> = T extends Sink<infer _A, infer _E, infer R> ? R : never

  /**
   * @since 1.20.0
   */
  export type Error<T> = T extends Sink<infer _A, infer E, infer _R> ? E : never

  /**
   * @since 1.20.0
   */
  export type Success<T> = T extends Sink<infer A, infer _E, infer _R> ? A : never

  /**
   * @since 1.20.0
   */
  export interface Tagged<A, E, I> extends Sink<A, E, I> {
    readonly tag: C.Tagged<I, Sink<A, E>>
    readonly make: <R>(sink: Sink<A, E, R>) => Layer.Layer<I, never, R>
  }
}

/**
 * @since 1.20.0
 */
export type Context<T> = Sink.Context<T>

/**
 * @since 1.20.0
 */
export type Error<T> = Sink.Error<T>

/**
 * @since 1.20.0
 */
export type Success<T> = Sink.Success<T>

/**
 * @since 1.20.0
 */
export function make<E, R, A, R2>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<unknown, never, R>,
  onSuccess: (value: A) => Effect.Effect<unknown, never, R2>
): Sink<A, E, R | R2> {
  return {
    onFailure,
    onSuccess
  }
}

/**
 * A Sink which can be utilized to exit early from an Fx.
 * Useful for operators the end the stream early.
 * @since 1.18.0
 * @category models
 */
export interface WithEarlyExit<A, E = never, R = never> extends Sink<A, E, R> {
  readonly earlyExit: Effect.Effect<void>
}

/**
 * @since 1.20.0
 */
export function withEarlyExit<A, E, R, B, R2>(
  sink: Sink<A, E, R>,
  f: (sink: WithEarlyExit<A, E, R>) => Effect.Effect<B, E, R2>
): Effect.Effect<void, never, R | R2> {
  return Effect.asyncEffect((resume: (effect: Effect.Effect<void>) => void) => {
    const earlyExit: WithEarlyExit<A, E, R> = {
      ...sink,
      earlyExit: Effect.sync(() => resume(Effect.void))
    }

    return Effect.matchCauseEffect(f(earlyExit), {
      onFailure: (cause) => Effect.asVoid(sink.onFailure(cause)),
      onSuccess: () => earlyExit.earlyExit
    })
  })
}

/**
 * Transform the input value of a Sink.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <B, A>(f: (b: B) => A): <E, R>(sink: Sink<A, E, R>) => Sink<B, E, R>
  <A, E, R, B>(sink: Sink<A, E, R>, f: (b: B) => A): Sink<B, E, R>
} = dual(2, function map<A, E, R, B>(
  sink: Sink<A, E, R>,
  f: (b: B) => A
): Sink<B, E, R> {
  return new MapSink(sink, f)
})

class MapSink<A, E, R, B> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<B, E, R>,
    readonly f: (a: A) => B
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(this.f(value))
  }
}

/**
 * @since 1.20.0
 */
export function filter<A, E, R>(sink: Sink<A, E, R>, predicate: Predicate.Predicate<A>): Sink<A, E, R> {
  return new FilterSink(sink, predicate)
}

class FilterSink<A, E, R> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<A, E, R>,
    readonly predicate: Predicate.Predicate<A>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    if (this.predicate(value)) return this.sink.onSuccess(value)
    else return Effect.void
  }
}

/**
 * @since 1.20.0
 */
export function filterMap<A, E, R, B>(sink: Sink<B, E, R>, f: (a: A) => Option.Option<B>): Sink<A, E, R> {
  return new FilterMapSink(sink, f)
}

class FilterMapSink<A, E, R, B> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<B, E, R>,
    readonly f: (a: A) => Option.Option<B>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    const option = this.f(value)
    if (Option.isSome(option)) return this.sink.onSuccess(option.value)
    else return Effect.void
  }
}

/**
 * @since 1.20.0
 */
export const mapEffect: {
  <B, A, E2, R2>(f: (b: B) => Effect.Effect<A, E2, R2>): <E, R>(
    sink: Sink<A, E | E2, R>
  ) => Sink<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(sink: Sink<A, E | E2, R>, f: (b: B) => Effect.Effect<A, E2, R2>): Sink<B, E | E2, R | R2>
} = dual(2, function mapEffect<A, E, R, B, E2, R2>(
  sink: Sink<A, E | E2, R>,
  f: (b: B) => Effect.Effect<A, E2, R2>
): Sink<B, E | E2, R | R2> {
  return new MapEffectSink(sink, f)
})

class MapEffectSink<A, E, R, B, E2, R2> implements Sink<B, E2, R | R2> {
  constructor(
    readonly sink: Sink<A, E | E2, R>,
    readonly f: (b: B) => Effect.Effect<A, E2, R2>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E2>): Effect.Effect<unknown, never, R | R2> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: B) {
    return Effect.matchCauseEffect(this.f(value), this.sink)
  }
}

/**
 * @since 1.20.0
 */
export const filterMapEffect: {
  <B, A, E2, R2>(f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>): <E, R>(
    sink: Sink<A, E | E2, R>
  ) => Sink<B, E | E2, R | R2>

  <A, E, R, B, E2, R2>(
    sink: Sink<A, E | E2, R>,
    f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>
  ): Sink<B, E | E2, R | R2>
} = dual(2, function filterMapEffect<A, E, R, B, E2, R2>(
  sink: Sink<A, E | E2, R>,
  f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>
): Sink<B, E | E2, R | R2> {
  return new FilterMapEffectSink(sink, f)
})

class FilterMapEffectSink<A, E, R, B, E2, R2> implements Sink<B, E2, R | R2> {
  constructor(
    readonly sink: Sink<A, E | E2, R>,
    readonly f: (b: B) => Effect.Effect<Option.Option<A>, E2, R2>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E2>): Effect.Effect<unknown, never, R | R2> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: B) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: (option) => {
        if (Option.isSome(option)) return this.sink.onSuccess(option.value)
        else return Effect.void
      }
    })
  }
}

/**
 * @since 1.20.0
 */
export const filterEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(
    sink: Sink<A, E | E2, R>
  ) => Sink<A, E | E2, R | R2>
  <A, E, R>(sink: Sink<A, E, R>, f: (a: A) => Effect.Effect<boolean, E, R>): Sink<A, E, R>
} = dual(2, function filterEffect<A, E, R, R2>(
  sink: Sink<A, E, R>,
  f: (a: A) => Effect.Effect<boolean, E, R2>
): Sink<A, E, R | R2> {
  return new FilterEffectSink<A, E, R | R2>(sink, f)
})

class FilterEffectSink<A, E, R> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<A, E, R>,
    readonly f: (a: A) => Effect.Effect<boolean, E, R>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: (b) => {
        if (b) return this.sink.onSuccess(value)
        else return Effect.void
      }
    })
  }
}

/**
 * @since 1.20.0
 */
export const tapEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<unknown, E2, R2>): <E, R>(
    sink: Sink<A, E | E2, R>
  ) => Sink<A, E | E2, R | R2>
  <A, E, R, E2, R2>(sink: Sink<A, E | E2, R>, f: (a: A) => Effect.Effect<unknown, E2, R2>): Sink<A, E | E2, R | R2>
} = dual(2, function tapEffect<A, E, R, E2, R2>(
  sink: Sink<A, E | E2, R>,
  f: (a: A) => Effect.Effect<unknown, E2, R2>
): Sink<A, E | E2, R | R2> {
  return new TapEffectSink(sink, f)
})

class TapEffectSink<A, E, R, E2, R2> implements Sink<A, E, R | R2> {
  constructor(
    readonly sink: Sink<A, E | E2, R>,
    readonly f: (a: A) => Effect.Effect<unknown, E2, R2>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R | R2> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: () => this.sink.onSuccess(value)
    })
  }
}

/**
 * @since 1.20.0
 */
export const loop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <E, R>(
    sink: Sink<C, E, R>
  ) => Sink<A, E, R>
  <A, E, R, B, C>(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Sink<A, E, R>
} = dual(3, function loop<A, E, R, B, C>(
  sink: Sink<C, E, R>,
  seed: B,
  f: (acc: B, a: A) => readonly [C, B]
): Sink<A, E, R> {
  return new LoopSink(sink, seed, f)
})

class LoopSink<A, E, R, B, C> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<C, E, R>,
    private seed: B,
    readonly f: (acc: B, a: A) => readonly [C, B]
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    const [c, acc] = this.f(this.seed, value)
    this.seed = acc
    return this.sink.onSuccess(c)
  }
}

/**
 * @since 1.20.0
 */
export const loopCause: {
  <B, A, C>(seed: B, f: (acc: B, a: Cause.Cause<A>) => readonly [Cause.Cause<C>, B]): <E, R>(
    sink: Sink<A, C, R>
  ) => Sink<A, E, R>
  <A, E, R, B, C>(
    sink: Sink<A, C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): Sink<A, E, R>
} = dual(3, function loopCause<A, E, R, B, C>(
  sink: Sink<A, C, R>,
  seed: B,
  f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
): Sink<A, E, R> {
  return new LoopCauseSink(sink, seed, f)
})

class LoopCauseSink<A, E, R, B, C> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<A, C, R>,
    private seed: B,
    readonly f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    const [c, acc] = this.f(this.seed, cause)
    this.seed = acc
    return this.sink.onFailure(c)
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value)
  }
}

/**
 * @since 1.20.0
 */
export const filterMapLoop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): <E, R>(
    sink: Sink<C, E, R>
  ) => Sink<A, E, R>
  <A, E, R, B, C>(sink: Sink<C, E, R>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): Sink<A, E, R>
} = dual(3, function filterMapLoop<A, E, R, B, C>(
  sink: Sink<C, E, R>,
  seed: B,
  f: (acc: B, a: A) => readonly [Option.Option<C>, B]
): Sink<A, E, R> {
  return new FilterMapLoopSink(sink, seed, f)
})

class FilterMapLoopSink<A, E, R, B, C> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<C, E, R>,
    private seed: B,
    readonly f: (acc: B, a: A) => readonly [Option.Option<C>, B]
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    const [option, acc] = this.f(this.seed, value)
    this.seed = acc
    if (Option.isSome(option)) return this.sink.onSuccess(option.value)
    else return Effect.void
  }
}

/**
 * @since 1.20.0
 */
export const filterMapLoopCause: {
  <B, A, C>(seed: B, f: (acc: B, a: Cause.Cause<A>) => readonly [Option.Option<Cause.Cause<C>>, B]): <E, R>(
    sink: Sink<A, C, R>
  ) => Sink<A, E, R>
  <A, E, R, B, C>(
    sink: Sink<A, C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ): Sink<A, E, R>
} = dual(3, function filterMapLoopCause<A, E, R, B, C>(
  sink: Sink<A, C, R>,
  seed: B,
  f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
): Sink<A, E, R> {
  return new FilterMapLoopCauseSink(sink, seed, f)
})

class FilterMapLoopCauseSink<A, E, R, B, C> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<A, C, R>,
    private seed: B,
    readonly f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    const [option, acc] = this.f(this.seed, cause)
    this.seed = acc
    if (Option.isSome(option)) return this.sink.onFailure(option.value)
    else return Effect.void
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value)
  }
}

/**
 * @since 1.20.0
 */
export const loopEffect: {
  <B, A, E2, R2, C>(seed: B, f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>): <E, R>(
    sink: Sink<C, E, R>
  ) => Sink<A, E | E2, R | R2>
  <A, E, R, B, C>(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>
  ): Sink<A, E, R>
} = dual(3, function loopEffect<A, E, R, B, C>(
  sink: Sink<C, E, R>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>
): Sink<A, E, R> {
  return new LoopEffectSink(sink, seed, f)
})

class LoopEffectSink<A, E, R, B, C> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<C, E, R>,
    private seed: B,
    readonly f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(this.seed, value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: ([c, acc]) => {
        this.seed = acc
        return this.sink.onSuccess(c)
      }
    })
  }
}

/**
 * @since 1.20.0
 */
export const filterMapLoopEffect: {
  <B, A, E2, R2, C>(seed: B, f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>): <E, R>(
    sink: Sink<C, E, R>
  ) => Sink<A, E | E2, R | R2>
  <A, E, R, B, R2, C>(
    sink: Sink<C, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>
  ): Sink<A, E, R | R2>
} = dual(3, function filterMapLoopEffect<A, E, R, B, R2, C>(
  sink: Sink<C, E, R>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>
): Sink<A, E, R | R2> {
  return new FilterMapLoopEffectSink(sink, seed, f)
})

class FilterMapLoopEffectSink<A, E, R, B, R2, C> implements Sink<A, E, R | R2> {
  constructor(
    readonly sink: Sink<C, E, R>,
    private seed: B,
    readonly f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(this.seed, value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: ([option, acc]) => {
        this.seed = acc
        if (Option.isSome(option)) return this.sink.onSuccess(option.value)
        else return Effect.void
      }
    })
  }
}

/**
 * @since 1.20.0
 */
export const loopCauseEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => Effect.Effect<readonly [Cause.Cause<C>, B], E2, R2>
  ): <E, R>(
    sink: Sink<A, E | C, R>
  ) => Sink<A, E | C, R>
  <A, E, R, B, C>(
    sink: Sink<A, E | C, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R>
  ): Sink<A, E | C, R>
} = dual(3, function loopCauseEffect<A, E, R, B, C>(
  sink: Sink<A, E | C, R>,
  seed: B,
  f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R>
): Sink<A, E | C, R> {
  return new LoopCauseEffectSink(sink, seed, f)
})

class LoopCauseEffectSink<A, E, R, B, C> implements Sink<A, E, R> {
  constructor(
    readonly sink: Sink<A, E | C, R>,
    private seed: B,
    readonly f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return Effect.matchCauseEffect(this.f(this.seed, cause), {
      onFailure: (cause2) => this.sink.onFailure(Cause.sequential(cause, cause2)),
      onSuccess: ([c, acc]) => {
        this.seed = acc
        return this.sink.onFailure(c)
      }
    })
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value)
  }
}

/**
 * @since 1.20.0
 */
export function filterMapLoopCauseEffect<A, E, R, B, E2, R2, C>(
  sink: Sink<A, E2 | C, R>,
  seed: B,
  f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
): Sink<A, E, R | R2> {
  return new FilterMapLoopCauseEffectSink(sink, seed, f)
}

class FilterMapLoopCauseEffectSink<A, E, R, B, E2, R2, C> implements Sink<A, E, R | R2> {
  constructor(
    readonly sink: Sink<A, E2 | C, R>,
    private seed: B,
    readonly f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R | R2> {
    return Effect.matchCauseEffect(this.f(this.seed, cause), {
      onFailure: (cause2) => this.sink.onFailure(cause2),
      onSuccess: ([option, acc]) => {
        this.seed = acc
        if (Option.isSome(option)) return this.sink.onFailure(option.value)
        else return Effect.void
      }
    })
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(value)
  }
}

/**
 * @since 1.20.0
 */
export const slice: {
  <A, E, R, R2>(bounds: Bounds, f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, never, R2>): (
    sink: Sink<A, E, R>
  ) => Effect.Effect<void, never, R | R2>
  <A, E, R, R2>(
    sink: Sink<A, E, R>,
    bounds: Bounds,
    f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, never, R2>
  ): Effect.Effect<void, never, R | R2>
} = dual(3, function slice<A, E, R, R2>(
  sink: Sink<A, E, R>,
  bounds: Bounds,
  f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, never, R2>
): Effect.Effect<void, never, R | R2> {
  return withEarlyExit(sink, (s) => f(new SliceSink(s, bounds)))
})

class SliceSink<A, E, R> implements Sink<A, E, R> {
  private drop: number
  private take: number

  constructor(
    readonly sink: WithEarlyExit<A, E, R>,
    readonly bounds: Bounds
  ) {
    this.drop = this.bounds.min
    this.take = this.bounds.max

    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    if (this.drop > 0) {
      this.drop--
      return Effect.void
    }
    if (this.take-- > 0) {
      return Effect.tap(this.sink.onSuccess(value), () => this.take === 0 ? this.sink.earlyExit : Effect.void)
    }
    return this.sink.earlyExit
  }
}

/**
 * @since 1.20.0
 */
export const takeWhile: {
  <A, E, R, B, R2>(predicate: Predicate.Predicate<A>, f: (sink: Sink<A, E, R>) => Effect.Effect<B, E, R2>): (
    sink: Sink<A, E, R>
  ) => Effect.Effect<void, never, R | R2>
  <A, E, R, B, R2>(
    sink: Sink<A, E, R>,
    predicate: Predicate.Predicate<A>,
    f: (sink: Sink<A, E, R>) => Effect.Effect<B, E, R2>
  ): Effect.Effect<void, never, R | R2>
} = dual(3, function takeWhile<A, E, R, B, R2>(
  sink: Sink<A, E, R>,
  predicate: Predicate.Predicate<A>,
  f: (sink: Sink<A, E, R>) => Effect.Effect<B, E, R2>
) {
  return withEarlyExit(sink, (s) => f(new TakeWhileSink(s, predicate)))
})

class TakeWhileSink<A, E, R> implements Sink<A, E, R> {
  private take: boolean

  constructor(
    readonly sink: WithEarlyExit<A, E, R>,
    readonly predicate: Predicate.Predicate<A>
  ) {
    this.take = true
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    if (this.take === true && (this.take = this.predicate(value))) return this.sink.onSuccess(value)
    else {
      this.take = false
      return this.sink.earlyExit
    }
  }
}

/**
 * @since 1.20.0
 */
export const dropWhile: {
  <A>(predicate: Predicate.Predicate<A>): <E, R>(
    sink: Sink<A, E, R>
  ) => Sink<A, E, R>
  <A, E, R>(sink: Sink<A, E, R>, predicate: Predicate.Predicate<A>): Sink<A, E, R>
} = dual(2, function dropWhile<A, E, R>(
  sink: Sink<A, E, R>,
  predicate: Predicate.Predicate<A>
): Sink<A, E, R> {
  return filterMapLoop(sink, true, (drop: boolean, a: A) => {
    const drop2 = drop && predicate(a)
    return [drop2 ? Option.none() : Option.some(a), drop2]
  })
})

/**
 * @since 2.0.0
 */
export const dropAfter: {
  <A, E, R, R2>(
    sink: Sink<A, E, R>,
    predicate: Predicate.Predicate<A>,
    f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, E, R2>
  ): Effect.Effect<void, never, R | R2>
} = dual(3, function dropAfter<A, E, R, R2>(
  sink: Sink<A, E, R>,
  predicate: Predicate.Predicate<A>,
  f: (sink: Sink<A, E, R>) => Effect.Effect<unknown, E, R2>
): Effect.Effect<void, never, R | R2> {
  return withEarlyExit(sink, (s) => f(new DropAfterSink(s, predicate)))
})

class DropAfterSink<A, E, R> implements Sink<A, E, R> {
  constructor(
    readonly sink: WithEarlyExit<A, E, R>,
    readonly predicate: Predicate.Predicate<A>
  ) {
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    if (this.predicate(value)) {
      return Effect.zipRight(this.sink.onSuccess(value), this.sink.earlyExit)
    }
    return this.sink.onSuccess(value)
  }
}

/**
 * @since 1.20.0
 */
export const takeWhileEffect: {
  <A, E, R, E2, R2, R3, E3, B>(
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
    f: (sink: Sink<A, E, R | R2>) => Effect.Effect<B, E3, R3>
  ): <E, R>(
    sink: Sink<A, E, R>
  ) => Effect.Effect<void, never, R | R3>
  <A, E, R, E2, R2, R3, E3, B>(
    sink: Sink<A, E | E2 | E3, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
    f: (sink: Sink<A, E, R | R2>) => Effect.Effect<B, E3, R3>
  ): Effect.Effect<void, never, R | R3>
} = dual(3, function takeWhileEffect<A, E, R, E2, R2, R3, E3, B>(
  sink: Sink<A, E | E2 | E3, R>,
  predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  f: (sink: Sink<A, E, R | R2>) => Effect.Effect<B, E3, R3>
) {
  return withEarlyExit(sink, (s) => f(new TakeWhileEffectSink(s, predicate)))
})

class TakeWhileEffectSink<A, E, R, E2, R2> implements Sink<A, E, R | R2> {
  private take: boolean

  constructor(
    readonly sink: WithEarlyExit<A, E | E2, R>,
    readonly predicate: (a: A) => Effect.Effect<boolean, E2, R2>
  ) {
    this.take = true
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  onFailure(cause: Cause.Cause<E | E2>): Effect.Effect<unknown, never, R | R2> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    if (this.take === true) {
      return Effect.matchCauseEffect(this.predicate(value), {
        onFailure: (cause) => this.sink.onFailure(cause),
        onSuccess: (b) => {
          if ((this.take = b)) return this.sink.onSuccess(value)
          else return this.sink.earlyExit
        }
      })
    } else return this.sink.earlyExit
  }
}

/**
 * @since 1.20.0
 */
export const dropWhileEffect: {
  <A, E2, R2>(predicate: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(
    sink: Sink<A, E | E2, R>
  ) => Sink<A, E | E2, R | R2>
  <A, E, R, E2, R2>(
    sink: Sink<A, E | E2, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>
  ): Sink<A, E | E2, R | R2>
} = dual(2, function dropWhileEffect<A, E, R, E2, R2>(
  sink: Sink<A, E | E2, R>,
  predicate: (a: A) => Effect.Effect<boolean, E2, R2>
): Sink<A, E | E2, R | R2> {
  return filterMapLoopEffect<A, E | E2, R, boolean, R2, A>(sink, true, (drop: boolean, a: A) => {
    if (drop === false) return Effect.succeed([Option.some(a), drop as boolean] as const)

    return Effect.map(predicate(a), (b) => [b ? Option.none<A>() : Option.some(a), b] as const)
  })
})

/**
 * @since 1.20.0
 */
export const dropAfterEffect: {
  <A, E2, R2>(predicate: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(
    sink: Sink<A, E | E2, R>
  ) => Sink<A, E | E2, R | R2>
  <A, E, R, E2, R2>(
    sink: Sink<A, E | E2, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>
  ): Sink<A, E | E2, R | R2>
} = dual(2, function dropAfterEffect<A, E, R, E2, R2>(
  sink: Sink<A, E | E2, R>,
  predicate: (a: A) => Effect.Effect<boolean, E2, R2>
): Sink<A, E | E2, R | R2> {
  return filterMapLoopEffect<A, E | E2, R, boolean, R2, A>(sink, false, (drop: boolean, a: A) => {
    if (drop === true) return Effect.succeed([Option.none(), drop as boolean] as const)

    return Effect.map(predicate(a), (b) => [Option.some(a), b] as const)
  })
})

/**
 * @since 1.20.0
 */
export const provide: {
  <R2>(ctx: C.Context<R2>): <A, E, R>(sink: Sink<A, E, R>) => Sink<A, E, Exclude<R, R2>>
  <A, E, R, R2>(sink: Sink<A, E, R>, ctx: C.Context<R2>): Sink<A, E, Exclude<R, R2>>
} = dual(2, function provide<A, E, R, R2>(
  sink: Sink<A, E, R>,
  ctx: C.Context<R2>
): Sink<A, E, Exclude<R, R2>> {
  return make(
    (cause) => Effect.provide(sink.onFailure(cause), ctx),
    (a) => Effect.provide(sink.onSuccess(a), ctx)
  )
})

/**
 * @since 1.20.0
 */
export const setSpan: {
  (span: Tracer.Span): <A, E, R>(sink: Sink<A, E, R>) => Sink<A, E, R>
  <A, E, R>(self: Sink<A, E, R>, span: Tracer.Span): Sink<A, E, R>
} = dual(2, function setSpan<A, E, R>(
  self: Sink<A, E, R>,
  span: Tracer.Span
): Sink<A, E, R> {
  return make(
    (cause) =>
      addEvent(self.onFailure(cause), "fx.failure", span, {
        "cause": Cause.pretty(cause)
      }),
    (a) =>
      addEvent(self.onSuccess(a), "fx.success", span, {
        "value": JSON.stringify(a)
      })
  )
})

const addEvent = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  name: string,
  span: Tracer.Span,
  attributes: Record<string, unknown>
): Effect.Effect<A, E, R> =>
  Effect.flatMap(Clock.currentTimeNanos, (time) =>
    Effect.suspend(() => {
      span.event(name, time, attributes)

      return effect
    }))

/**
 * @since 1.20.0
 */
export function tagged<E, A>(): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): Sink.Tagged<A, E, C.IdentifierOf<I>>
  <const I>(identifier: I): Sink.Tagged<A, E, C.IdentifierOf<I>>
} {
  return <const I>(identifier: I) => new TaggedImpl(C.Tagged<I, Sink<A, E>>(identifier))
}

class TaggedImpl<A, E, I> implements Sink.Tagged<A, E, I> {
  constructor(readonly tag: C.Tagged<I, Sink<A, E>>) {}

  onSuccess(value: A): Effect.Effect<unknown, never, I> {
    return this.tag.withEffect((sink) => sink.onSuccess(value))
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, I> {
    return this.tag.withEffect((sink) => sink.onFailure(cause))
  }

  make: <R>(sink: Sink<A, E, R>) => Layer.Layer<I, never, R> = <R>(sink: Sink<A, E, R>) =>
    Layer.flatMap(Layer.context<R>(), (ctx) => this.tag.layer(provide(sink, ctx)))
}

/**
 * @since 1.20.0
 */
export const fromTag: {
  <S, B, E2, R2>(f: (s: S) => Sink<B, E2, R2>): <I>(tag: C.Tag<I, S>) => Sink<B, E2, I | R2>
  <I, S, B, E2, R2>(tag: C.Tag<I, S>, f: (s: S) => Sink<B, E2, R2>): Sink<B, E2, I | R2>
} = dual(2, function fromTag<I, S, B, E2, R2>(
  tag: C.Tag<I, S>,
  f: (s: S) => Sink<B, E2, R2>
): Sink<B, E2, I | R2> {
  return new FromTag(tag, f)
})

class FromTag<I, S, B, E2, R2> implements Sink<B, E2, I | R2> {
  readonly get: Effect.Effect<Sink<B, E2, R2>, never, I>

  constructor(readonly tag: C.Tag<I, S>, readonly f: (s: S) => Sink<B, E2, R2>) {
    this.get = Effect.map(tag, f)
  }

  onSuccess(value: B): Effect.Effect<unknown, never, I | R2> {
    return Effect.flatMap(this.get, (sink) => sink.onSuccess(value))
  }

  onFailure(cause: Cause.Cause<E2>): Effect.Effect<unknown, never, I | R2> {
    return Effect.flatMap(this.get, (sink) => sink.onFailure(cause))
  }
}

/**
 * @since 1.20.0
 */
export function ignoreInterrupt<A, E, R>(sink: Sink<A, E, R>): Sink<A, E, R> {
  return make(
    (cause) => Cause.isInterruptedOnly(cause) ? Effect.void : sink.onFailure(cause),
    sink.onSuccess
  )
}

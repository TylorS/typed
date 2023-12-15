import { Effect, Option } from "effect"
import type { Cause, Predicate } from "effect"
import { dual } from "effect/Function"
import { type Bounds } from "../internal/bounds"

export interface Sink<out R, in E, in A> {
  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown>
  onSuccess(value: A): Effect.Effect<R, never, unknown>
}

export function make<E, R, A, R2>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>,
  onSuccess: (value: A) => Effect.Effect<R2, never, unknown>
): Sink<R | R2, E, A> {
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
export interface WithEarlyExit<R, E, A> extends Sink<R, E, A> {
  readonly earlyExit: Effect.Effect<never, never, void>
}

export function withEarlyExit<R, E, A, R2, B>(
  sink: Sink<R, E, A>,
  f: (sink: WithEarlyExit<R, E, A>) => Effect.Effect<R2, E, B>
): Effect.Effect<R | R2, never, void> {
  return Effect.asyncEffect<never, never, void, R | R2, never, void>((resume) => {
    const earlyExit: WithEarlyExit<R, E, A> = {
      ...sink,
      earlyExit: Effect.sync(() => resume(Effect.unit))
    }

    return Effect.matchCauseEffect(f(earlyExit), {
      onFailure: (cause) => sink.onFailure(cause),
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
  <B, A>(f: (b: B) => A): <R, E>(sink: Sink<R, E, A>) => Sink<R, E, B>
  <R, E, A, B>(sink: Sink<R, E, A>, f: (b: B) => A): Sink<R, E, B>
} = dual(2, function map<R, E, A, B>(
  sink: Sink<R, E, A>,
  f: (b: B) => A
): Sink<R, E, B> {
  return new MapSink(sink, f)
})

class MapSink<R, E, A, B> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, B>,
    readonly f: (a: A) => B
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return this.sink.onSuccess(this.f(value))
  }
}

export function filter<R, E, A>(sink: Sink<R, E, A>, predicate: Predicate.Predicate<A>): Sink<R, E, A> {
  return new FilterSink(sink, predicate)
}

class FilterSink<R, E, A> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, A>,
    readonly predicate: Predicate.Predicate<A>
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    if (this.predicate(value)) return this.sink.onSuccess(value)
    else return Effect.unit
  }
}

export function filterMap<R, E, A, B>(sink: Sink<R, E, B>, f: (a: A) => Option.Option<B>): Sink<R, E, A> {
  return new FilterMapSink(sink, f)
}

class FilterMapSink<R, E, A, B> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, B>,
    readonly f: (a: A) => Option.Option<B>
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    const option = this.f(value)
    if (Option.isSome(option)) return this.sink.onSuccess(option.value)
    else return Effect.unit
  }
}

export function mapEffect<R, E, A, R2, E2, B>(
  sink: Sink<R, E | E2, A>,
  f: (b: B) => Effect.Effect<R2, E2, A>
): Sink<R | R2, E | E2, B> {
  return new MapEffectSink(sink, f)
}

class MapEffectSink<R, E, A, R2, E2, B> implements Sink<R | R2, E2, B> {
  constructor(
    readonly sink: Sink<R, E | E2, A>,
    readonly f: (b: B) => Effect.Effect<R2, E2, A>
  ) {}

  onFailure(cause: Cause.Cause<E2>): Effect.Effect<R | R2, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: B) {
    return Effect.matchCauseEffect(this.f(value), this.sink)
  }
}

export function filterMapEffect<R, E, A, R2, E2, B>(
  sink: Sink<R, E | E2, A>,
  f: (b: B) => Effect.Effect<R2, E2, Option.Option<A>>
): Sink<R | R2, E | E2, B> {
  return new FilterMapEffectSink(sink, f)
}

class FilterMapEffectSink<R, E, A, R2, E2, B> implements Sink<R | R2, E2, B> {
  constructor(
    readonly sink: Sink<R, E | E2, A>,
    readonly f: (b: B) => Effect.Effect<R2, E2, Option.Option<A>>
  ) {}

  onFailure(cause: Cause.Cause<E2>): Effect.Effect<R | R2, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: B) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: (option) => {
        if (Option.isSome(option)) return this.sink.onSuccess(option.value)
        else return Effect.unit
      }
    })
  }
}

export function filterEffect<R, E, A>(
  sink: Sink<R, E, A>,
  f: (a: A) => Effect.Effect<R, E, boolean>
): Sink<R, E, A> {
  return new FilterEffectSink(sink, f)
}

class FilterEffectSink<R, E, A> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, A>,
    readonly f: (a: A) => Effect.Effect<R, E, boolean>
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: (b) => {
        if (b) return this.sink.onSuccess(value)
        else return Effect.unit
      }
    })
  }
}

export function tapEffect<R, E, A, R2, E2>(
  sink: Sink<R, E | E2, A>,
  f: (a: A) => Effect.Effect<R2, E2, unknown>
): Sink<R | R2, E | E2, A> {
  return new TapEffectSink(sink, f)
}

class TapEffectSink<R, E, A, R2, E2> implements Sink<R | R2, E, A> {
  constructor(
    readonly sink: Sink<R, E | E2, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, unknown>
  ) {}

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R | R2, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: () => this.sink.onSuccess(value)
    })
  }
}

export function loop<R, E, A, B, C>(
  sink: Sink<R, E, C>,
  seed: B,
  f: (acc: B, a: A) => readonly [C, B]
): Sink<R, E, A> {
  return new LoopSink(sink, seed, f)
}

class LoopSink<R, E, A, B, C> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, C>,
    private seed: B,
    readonly f: (acc: B, a: A) => readonly [C, B]
  ) {
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    const [c, acc] = this.f(this.seed, value)
    this.seed = acc
    return this.sink.onSuccess(c)
  }
}

export function filterMapLoop<R, E, A, B, C>(
  sink: Sink<R, E, C>,
  seed: B,
  f: (acc: B, a: A) => readonly [Option.Option<C>, B]
): Sink<R, E, A> {
  return new FilterMapLoopSink(sink, seed, f)
}

class FilterMapLoopSink<R, E, A, B, C> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, C>,
    private seed: B,
    readonly f: (acc: B, a: A) => readonly [Option.Option<C>, B]
  ) {
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    const [option, acc] = this.f(this.seed, value)
    this.seed = acc
    if (Option.isSome(option)) return this.sink.onSuccess(option.value)
    else return Effect.unit
  }
}

export function loopEffect<R, E, A, B, C>(
  sink: Sink<R, E, C>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R, E, readonly [C, B]>
): Sink<R, E, A> {
  return new LoopEffectSink(sink, seed, f)
}

class LoopEffectSink<R, E, A, B, C> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, C>,
    private seed: B,
    readonly f: (acc: B, a: A) => Effect.Effect<R, E, readonly [C, B]>
  ) {
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
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

export function filterMapLoopEffect<R, E, A, B, C>(
  sink: Sink<R, E, C>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R, E, readonly [Option.Option<C>, B]>
): Sink<R, E, A> {
  return new FilterMapLoopEffectSink(sink, seed, f)
}

class FilterMapLoopEffectSink<R, E, A, B, C> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, C>,
    private seed: B,
    readonly f: (acc: B, a: A) => Effect.Effect<R, E, readonly [Option.Option<C>, B]>
  ) {
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    return Effect.matchCauseEffect(this.f(this.seed, value), {
      onFailure: (cause) => this.sink.onFailure(cause),
      onSuccess: ([option, acc]) => {
        this.seed = acc
        if (Option.isSome(option)) return this.sink.onSuccess(option.value)
        else return Effect.unit
      }
    })
  }
}

export function slice<R, E, A, R2>(
  sink: Sink<R, E, A>,
  bounds: Bounds,
  f: (sink: Sink<R, E, A>) => Effect.Effect<R2, never, unknown>
): Effect.Effect<R | R2, never, void> {
  return withEarlyExit(sink, (s) => f(new SliceSink(s, bounds)))
}

class SliceSink<R, E, A> implements Sink<R, E, A> {
  private drop: number
  private take: number

  constructor(
    readonly sink: WithEarlyExit<R, E, A>,
    readonly bounds: Bounds
  ) {
    this.drop = this.bounds.min
    this.take = this.bounds.max
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A) {
    if (this.drop > 0) {
      this.drop--
      return Effect.unit
    }
    if (this.take > 0) {
      return Effect.tap(this.sink.onSuccess(value), () => --this.take === 0 ? this.sink.earlyExit : Effect.unit)
    }
    return this.sink.earlyExit
  }
}

// TODO: Snapshot operators
// TODO: Higher-order operators

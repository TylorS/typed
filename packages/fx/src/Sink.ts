import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'

// filter, map, scan, reduce
// flatMap, switchMap, mergeMap, exhaustMap, exhaustMapLatest
// slice
// takeWhile

const unit_ = () => Effect.unit

export interface Sink<R, E, A> {
  readonly event: (a: A) => Effect.Effect<R, never, void>
  readonly error: (e: Cause.Cause<E>) => Effect.Effect<R, never, void>
}

export function Sink<A, R, E, R2>(
  event: (a: A) => Effect.Effect<R, never, void>,
  error: (e: Cause.Cause<E>) => Effect.Effect<R2, never, void>,
): Sink<R | R2, E, A> {
  return {
    event,
    error,
  }
}

export function map<R, E, A, B>(sink: Sink<R, E, A>, f: (a: B) => A): Sink<R, E, B> {
  return MapSink.make(sink, f)
}

export function tapSync<R, E, A>(sink: Sink<R, E, A>, f: (a: A) => void): Sink<R, E, A> {
  return MapSink.make(sink, (a) => {
    f(a)
    return a
  })
}

export class MapSink<R, E, A, B> implements Sink<R, E, B> {
  constructor(
    readonly sink: Sink<R, E, A>,
    readonly f: (a: B) => A,
  ) {}

  event(a: B): Effect.Effect<R, never, void> {
    return this.sink.event(this.f(a))
  }

  error(e: Cause.Cause<E>): Effect.Effect<R, never, void> {
    return this.sink.error(e)
  }

  static make<R, E, A, B>(sink: Sink<R, E, A>, f: (a: B) => A): Sink<R, E, B> {
    if (MapSink.is(sink)) {
      return new MapSink(sink.sink, (a) => sink.f(f(a)))
    } else if (Transducable.is(sink)) {
      return new Transducable(sink.sink, (a) => sink.f(f(a)))
    } else if (TransducableEffect.is(sink)) {
      return new TransducableEffect(sink.sink, (a) => sink.f(f(a)))
    } else if (FilterLoopSink.is(sink)) {
      return new FilterLoopSink(sink.sink, (b, a) => sink.f(b, f(a)), sink.init)
    } else if (FilterLoopEffectSink.is(sink)) {
      return new FilterLoopEffectSink(sink.sink, (b, a) => sink.f(b, f(a)), sink.init)
    } else {
      return new MapSink(sink, f)
    }
  }

  static is<R, E, A>(sink: Sink<R, E, A>): sink is MapSink<R, E, any, A> {
    return sink.constructor === MapSink
  }
}

export function filter<R, E, A>(sink: Sink<R, E, A>, predicate: (a: A) => boolean): Sink<R, E, A> {
  return filterMap(sink, Option.liftPredicate(predicate))
}

export function filterMap<R, E, A, B>(
  sink: Sink<R, E, A>,
  f: (a: B) => Option.Option<A>,
): Sink<R, E, B> {
  return Transducable.make(sink, f)
}

export class Transducable<R, E, A, B> implements Sink<R, E, A> {
  constructor(
    readonly sink: Sink<R, E, B>,
    readonly f: (a: A) => Option.Option<B>,
  ) {}

  event(a: A): Effect.Effect<R, never, void> {
    return Option.match(this.f(a), {
      onNone: unit_,
      onSome: (b) => this.sink.event(b),
    })
  }

  error(e: Cause.Cause<E>): Effect.Effect<R, never, void> {
    return this.sink.error(e)
  }

  static make<R, E, A, B>(sink: Sink<R, E, B>, f: (a: A) => Option.Option<B>): Sink<R, E, A> {
    if (MapSink.is(sink)) {
      return new Transducable(sink.sink, (a) => Option.map(f(a), sink.f))
    } else if (Transducable.is(sink)) {
      return new Transducable(sink.sink, (a) => Option.flatMap(f(a), sink.f))
    } else if (TransducableEffect.is(sink)) {
      return new TransducableEffect(sink.sink, (a) =>
        Option.match(f(a), {
          onNone: () => Effect.succeedNone,
          onSome: sink.f,
        }),
      )
    } else if (FilterLoopSink.is(sink)) {
      return new FilterLoopSink(
        sink.sink,
        (b, a) => Option.flatMap(f(a), (c) => sink.f(b, c)),
        sink.init,
      )
    } else if (FilterLoopEffectSink.is(sink)) {
      return new FilterLoopEffectSink(
        sink.sink,
        (b, a) =>
          Option.match(f(a), {
            onNone: () => Effect.succeedNone,
            onSome: (c) => sink.f(b, c),
          }),
        sink.init,
      )
    } else {
      return new Transducable(sink, f)
    }
  }

  static is<R, E, A>(sink: Sink<R, E, A>): sink is Transducable<R, E, any, A> {
    return sink.constructor === Transducable
  }
}

export class TransducableEffect<R, E, A, R2, E2, B> implements Sink<R | R2, E, A> {
  constructor(
    readonly sink: Sink<R, E | E2, B>,
    readonly f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ) {}

  event(a: A): Effect.Effect<R | R2, never, void> {
    return Effect.matchCauseEffect(this.f(a), {
      onFailure: (cause) => this.sink.error(cause),
      onSuccess: Option.match({ onNone: unit_, onSome: (b) => this.sink.event(b) }),
    })
  }

  error(e: Cause.Cause<E>): Effect.Effect<R | R2, never, void> {
    return this.sink.error(e)
  }

  static make<R, E, A, R2, E2, B>(
    sink: Sink<R, E | E2, B>,
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ): Sink<R | R2, E, A> {
    if (MapSink.is(sink)) {
      return new TransducableEffect(sink.sink, (a) => Effect.map(f(a), Option.map(sink.f)))
    } else if (Transducable.is(sink)) {
      return new TransducableEffect(sink.sink, (a) => Effect.map(f(a), Option.flatMap(sink.f)))
    } else if (TransducableEffect.is(sink)) {
      return new TransducableEffect<R, E, A, R | R2, E | E2, B>(sink.sink, (a: A) =>
        Effect.matchCauseEffect(f(a), {
          onFailure: (cause) => Effect.zipRight(sink.error(cause), Effect.succeedNone),
          onSuccess: Option.match({
            onNone: () => Effect.succeedNone,
            onSome: sink.f,
          }),
        }),
      )
    } else if (FilterLoopSink.is(sink)) {
      return new FilterLoopEffectSink(
        sink.sink,
        (b, a) =>
          Effect.map(
            f(a),
            Option.flatMap((c) => sink.f(b, c)),
          ),
        sink.init,
      )
    } else if (FilterLoopEffectSink.is(sink)) {
      return new FilterLoopEffectSink(
        sink.sink,
        (b, a) =>
          Effect.matchCauseEffect(f(a), {
            onFailure: (cause) => Effect.zipRight(sink.error(cause), Effect.succeedNone),
            onSuccess: Option.match({
              onNone: () => Effect.succeedNone,
              onSome: (c) => sink.f(b, c),
            }),
          }),
        sink.init,
      )
    } else {
      return new TransducableEffect(sink, f)
    }
  }

  static is<R, E, A>(sink: Sink<R, E, A>): sink is TransducableEffect<R, E, any, R, E, A> {
    return sink.constructor === TransducableEffect
  }
}

export const loop = <R, E, A, B, C>(
  sink: Sink<R, E, C>,
  f: (b: B, a: A) => readonly [C, B],
  init: B,
): Sink<R, E, A> => filterLoop(sink, (b, a) => Option.some(f(b, a)), init)

export const reduce = <R, E, A, B>(
  sink: Sink<R, E, B>,
  f: (b: B, a: A) => B,
  init: B,
): Sink<R, E, A> => filterReduce(sink, (a, b) => Option.some(f(a, b)), init)

export const filterLoop = <R, E, A, B, C>(
  sink: Sink<R, E, C>,
  f: (b: B, a: A) => Option.Option<readonly [C, B]>,
  init: B,
): Sink<R, E, A> => new FilterLoopSink(sink, f, init)

export const filterReduce = <R, E, A, B>(
  sink: Sink<R, E, B>,
  f: (b: B, a: A) => Option.Option<B>,
  init: B,
): Sink<R, E, A> =>
  filterLoop(
    sink,
    (b, a) => {
      const option = f(b, a)
      return Option.map(option, (b) => [b, b])
    },
    init,
  )

export class FilterLoopSink<R, E, A, B, C> implements Sink<R, E, A> {
  private acc: B

  constructor(
    readonly sink: Sink<R, E, C>,
    readonly f: (b: B, a: A) => Option.Option<readonly [C, B]>,
    readonly init: B,
  ) {
    this.acc = init
  }

  event(a: A): Effect.Effect<R, never, void> {
    return Effect.suspend(() => {
      const option = this.f(this.acc, a)

      if (Option.isNone(option)) return Effect.unit

      const [c, b] = option.value

      this.acc = b
      return this.sink.event(c)
    })
  }

  error(e: Cause.Cause<E>): Effect.Effect<R, never, void> {
    return this.sink.error(e)
  }

  static make<R, E, A, B, C>(
    sink: Sink<R, E, C>,
    f: (b: B, a: A) => Option.Option<readonly [C, B]>,
    init: B,
  ): Sink<R, E, A> {
    if (MapSink.is(sink)) {
      return new FilterLoopSink(
        sink.sink,
        (a, b) => {
          const option = f(a, b)

          if (Option.isNone(option)) return option

          const [c, b2] = option.value

          return Option.some([sink.f(c), b2])
        },
        init,
      )
    } else {
      return new FilterLoopSink(sink, f, init)
    }
  }

  static is<R, E, A>(sink: Sink<R, E, A>): sink is FilterLoopSink<R, E, any, any, A> {
    return sink.constructor === FilterLoopSink
  }
}

export const filterLoopEffect = <R, E, A, R2, E2, B, C>(
  sink: Sink<R, E | E2, C>,
  f: (b: B, a: A) => Effect.Effect<R2, E2, Option.Option<readonly [C, B]>>,
  init: B,
): Sink<R | R2, E, A> => new FilterLoopEffectSink(sink, f, init)

export const filterReduceEffect = <R, E, A, R2, E2, B>(
  sink: Sink<R, E | E2, B>,
  f: (b: B, a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  init: B,
): Sink<R | R2, E, A> =>
  filterLoopEffect(
    sink,
    (b, a) =>
      Effect.map(
        f(b, a),
        Option.map((b) => [b, b]),
      ),
    init,
  )

export const loopEffect = <R, E, A, R2, E2, B, C>(
  sink: Sink<R, E | E2, C>,
  f: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>,
  init: B,
): Sink<R | R2, E, A> => filterLoopEffect(sink, (b, a) => Effect.map(f(b, a), Option.some), init)

export const reduceEffect = <R, E, A, R2, E2, B>(
  sink: Sink<R, E | E2, B>,
  f: (b: B, a: A) => Effect.Effect<R2, E2, B>,
  init: B,
): Sink<R | R2, E, A> => filterReduceEffect(sink, (b, a) => Effect.map(f(b, a), Option.some), init)

export class FilterLoopEffectSink<R, E, A, B, R2, E2, C> implements Sink<R | R2, E, A> {
  private acc: B

  constructor(
    readonly sink: Sink<R, E | E2, C>,
    readonly f: (b: B, a: A) => Effect.Effect<R2, E2, Option.Option<readonly [C, B]>>,
    readonly init: B,
  ) {
    this.acc = init
  }

  event(a: A): Effect.Effect<R | R2, never, void> {
    return Effect.matchCauseEffect(this.f(this.acc, a), {
      onFailure: (cause) => this.sink.error(cause),
      onSuccess: Option.match({
        onNone: unit_,
        onSome: ([c, b]) =>
          Effect.suspend(() => {
            this.acc = b
            return this.sink.event(c)
          }),
      }),
    })
  }

  error(e: Cause.Cause<E>): Effect.Effect<R | R2, never, void> {
    return this.sink.error(e)
  }

  static make<R, E, A, B, R2, E2, C>(
    sink: Sink<R, E | E2, C>,
    f: (b: B, a: A) => Effect.Effect<R2, E2, Option.Option<readonly [C, B]>>,
    init: B,
  ): Sink<R | R2, E, A> {
    if (MapSink.is(sink)) {
      return new FilterLoopEffectSink(
        sink.sink,
        (a, b) => {
          return Effect.map(f(a, b), (option) => {
            if (Option.isNone(option)) return option

            const [c, b2] = option.value

            return Option.some([sink.f(c), b2])
          })
        },
        init,
      )
    } else {
      return new FilterLoopEffectSink(sink, f, init)
    }
  }

  static is<R, E, A>(
    sink: Sink<R, E, A>,
  ): sink is FilterLoopEffectSink<R, E, any, any, any, any, A> {
    return sink.constructor === FilterLoopEffectSink
  }
}

export class Observe<R, E, A> implements Sink<R, E, A> {
  constructor(
    readonly deferred: Deferred.Deferred<E, void>,
    readonly f: (a: A) => Effect.Effect<R, E, void>,
  ) {}

  event(a: A): Effect.Effect<R, never, void> {
    return Effect.matchCauseEffect(this.f(a), {
      onFailure: this.error,
      onSuccess: unit_,
    })
  }

  error(e: Cause.Cause<E>): Effect.Effect<R, never, void> {
    return Deferred.failCause(this.deferred, e)
  }

  end() {
    return Deferred.succeed(this.deferred, undefined)
  }

  await() {
    return Deferred.await(this.deferred)
  }

  static is<R, E, A>(sink: Sink<R, E, A>): sink is Observe<R, E, A> {
    return sink.constructor === Observe
  }
}

export const observe = <E0, R, E, A>(
  f: (a: A) => Effect.Effect<R, E, void>,
): Effect.Effect<never, never, Sink<R, E0, A>> =>
  Effect.map(Deferred.make<E0 | E, void>(), (deferred) => new Observe(deferred, f))

export const drain = <E, A>() => observe<never, never, E, A>(() => Effect.unit)

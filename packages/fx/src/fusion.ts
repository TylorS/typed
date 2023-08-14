import * as Either from '@effect/data/Either'
import { identity } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import { pipeArguments } from '@effect/data/Pipeable'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'

import { Fx, FxTypeId } from './Fx.js'
import * as Sink from './Sink.js'

const fxVariance = {
  _R: identity,
  _E: identity,
  _A: identity,
}

abstract class BaseFx<R, E, A> implements Fx<R, E, A> {
  readonly [FxTypeId] = fxVariance
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  }

  abstract run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, void>
}

export const succeed = <A>(value: A): Fx<never, never, A> => new Succeed(value)

export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E, never> => new FailCause(cause)

export const fromEffect = <R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> =>
  FromEffect.make(effect)

export const fromExit = <E, A>(exit: Exit.Exit<E, A>): Fx<never, E, A> =>
  Exit.match<E, A, Fx<never, E, A>>(exit, {
    onFailure: failCause,
    onSuccess: succeed,
  })

export const fromEither = <E, A>(either: Either.Either<E, A>): Fx<never, E, A> =>
  fromExit(Exit.fromEither(either))

export const fromOption = <A>(option: Option.Option<A>): Fx<never, never, A> =>
  Option.match(option, {
    onNone: () => empty,
    onSome: succeed,
  })

const empty: Fx<never, never, never> = new (class Empty extends BaseFx<never, never, never> {
  run() {
    return Effect.unit
  }
})()

export const map = <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> => Map.make(fx, f)

export const filterMap = <R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Option.Option<B>,
): Fx<R, E, B> => FilterMap.make(fx, f)

export const filter = <R, E, A>(fx: Fx<R, E, A>, f: (a: A) => boolean): Fx<R, E, A> =>
  Filter.make(fx, f)

// TODO: Determine how to handle creating less Fibers
// succeed, failCause, suspend
// fromEffect
// filter, map, scan, tap
// effect variants
// flatMap, switchMap, exhaustMap, exhaustMapLatest - attempt to avoid creating fibers
// skip/takeUntil, skip/takeWhile + higher-order variants
// reduce, drain, observe

class Succeed<A> extends BaseFx<never, never, A> {
  constructor(readonly value: A) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, never, A>): Effect.Effect<R2, never, void> {
    return sink.event(this.value)
  }
}

class FailCause<E> extends BaseFx<never, E, never> {
  constructor(readonly cause: Cause.Cause<E>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, never>): Effect.Effect<R2, never, void> {
    return sink.error(this.cause)
  }
}

class FromEffect<R, E, A> extends BaseFx<R, E, A> {
  constructor(readonly effect: Effect.Effect<R, E, A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, void> {
    return Effect.matchCauseEffect(this.effect, {
      onFailure: sink.error,
      onSuccess: sink.event,
    })
  }

  static make<R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> {
    return new FromEffect(effect)
  }
}

class Map<R, E, A, B> extends BaseFx<R, E, B> {
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (a: A) => B,
  ) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, B>): Effect.Effect<R | R2, never, void> {
    return this.fx.run(Sink.map(sink, this.f))
  }

  static make<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> {
    return new Map(fx, f)
  }
}

class FilterMap<R, E, A, B> extends BaseFx<R, E, B> {
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (a: A) => Option.Option<B>,
  ) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, B>): Effect.Effect<R | R2, never, void> {
    return this.fx.run(Sink.filterMap(sink, this.f))
  }

  static make<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B> {
    if (fx instanceof FailCause) {
      return fx
    } else {
      return new FilterMap(fx, f)
    }
  }
}

class Filter<R, E, A> extends BaseFx<R, E, A> {
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (a: A) => boolean,
  ) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, void> {
    return this.fx.run(Sink.filter(sink, this.f))
  }

  static make<R, E, A>(fx: Fx<R, E, A>, f: (a: A) => boolean): Fx<R, E, A> {
    if (fx instanceof FailCause) {
      return fx
    } else {
      return new Filter(fx, f)
    }
  }
}

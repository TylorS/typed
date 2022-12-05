import * as Option from '@fp-ts/data/Option'
import * as Predicate from '@fp-ts/data/Predicate'
import { Cause } from '@typed/cause'
import { Time } from '@typed/time'

import { unit } from '../Effect.js'
import { Scheduler } from '../Scheduler.js'
import { flow2 } from '../_internal.js'

import { Sink, Stream } from './Stream.js'

export function filter<A>(predicate: Predicate.Predicate<A>) {
  return <R, E>(stream: Stream<R, E, A>): Stream<R, E, A> => Filter.make(stream, predicate)
}

export function map<A, B>(f: (a: A) => B) {
  return <R, E>(stream: Stream<R, E, A>): Stream<R, E, B> => Map.make(stream, f)
}

export function filterMap<A, B>(f: (a: A) => Option.Option<B>) {
  return <R, E>(stream: Stream<R, E, A>): Stream<R, E, B> => FilterMap.make(stream, f)
}

class Filter<R, E, A> implements Stream<R, E, A> {
  readonly [Stream.TypeId] = Stream.Variance

  constructor(readonly stream: Stream<R, E, A>, readonly predicate: Predicate.Predicate<A>) {}

  run<R2>(sink: Sink<R2, E, A>, scheduler: Scheduler) {
    return this.stream.run(new FilterSink(sink, this.predicate), scheduler)
  }

  static make<R, E, A>(
    stream: Stream<R, E, A>,
    predicate: Predicate.Predicate<A>,
  ): Stream<R, E, A> {
    if (stream instanceof Filter<R, E, A>) {
      return new Filter(stream.stream, Predicate.and(predicate)(stream.predicate))
    }

    return new Filter(stream, predicate)
  }
}

class FilterSink<R, E, A> implements Sink<R, E, A> {
  constructor(readonly sink: Sink<R, E, A>, readonly predicate: Predicate.Predicate<A>) {}

  event(time: Time, a: A) {
    return this.predicate(a) ? this.sink.event(time, a) : unit
  }

  error(time: Time, e: Cause<E>) {
    return this.sink.error(time, e)
  }

  end(time: Time) {
    return this.sink.end(time)
  }
}

class Map<R, E, A, B> implements Stream<R, E, B> {
  readonly [Stream.TypeId] = Stream.Variance

  constructor(readonly stream: Stream<R, E, A>, readonly f: (a: A) => B) {}

  run<R2>(sink: Sink<R2, E, B>, scheduler: Scheduler) {
    return this.stream.run(new MapSink(sink, this.f), scheduler)
  }

  static make<R, E, A, B>(stream: Stream<R, E, A>, f: (a: A) => B): Stream<R, E, B> {
    if (stream instanceof Map<R, E, any, A>) {
      return new Map(stream.stream, flow2(stream.f, f))
    } else if (stream instanceof Filter<R, E, A>) {
      return FilterMap.make(stream.stream, (a) =>
        stream.predicate(a) ? Option.some(f(a)) : Option.none,
      )
    } else if (stream instanceof FilterMap<R, E, any, A>) {
      return new FilterMap(stream.stream, flow2(stream.f, Option.map(f)))
    }

    return new Map(stream, f)
  }
}

class MapSink<R, E, A, B> implements Sink<R, E, A> {
  constructor(readonly sink: Sink<R, E, B>, readonly f: (a: A) => B) {}

  event(time: Time, a: A) {
    return this.sink.event(time, this.f(a))
  }

  error(time: Time, e: Cause<E>) {
    return this.sink.error(time, e)
  }

  end(time: Time) {
    return this.sink.end(time)
  }
}

class FilterMap<R, E, A, B> implements Stream<R, E, B> {
  readonly [Stream.TypeId] = Stream.Variance

  constructor(readonly stream: Stream<R, E, A>, readonly f: (a: A) => Option.Option<B>) {}

  run<R2>(sink: Sink<R2, E, B>, scheduler: Scheduler) {
    return this.stream.run(new FilterMapSink(sink, this.f), scheduler)
  }

  static make<R, E, A, B>(stream: Stream<R, E, A>, f: (a: A) => Option.Option<B>): Stream<R, E, B> {
    if (stream instanceof Map<R, E, any, A>) {
      return new FilterMap(stream.stream, flow2(stream.f, f))
    } else if (stream instanceof Filter<R, E, A>) {
      return new FilterMap(stream.stream, (a) => (stream.predicate(a) ? f(a) : Option.none))
    } else if (stream instanceof FilterMap<R, E, any, A>) {
      return new FilterMap(stream.stream, flow2(stream.f, Option.flatMap(f)))
    }

    return new FilterMap(stream, f)
  }
}

class FilterMapSink<R, E, A, B> implements Sink<R, E, A> {
  constructor(readonly sink: Sink<R, E, B>, readonly f: (a: A) => Option.Option<B>) {}

  event(time: Time, a: A) {
    const b = this.f(a)

    return Option.isSome(b) ? this.sink.event(time, b.value) : unit
  }

  error(time: Time, e: Cause<E>) {
    return this.sink.error(time, e)
  }

  end(time: Time) {
    return this.sink.end(time)
  }
}

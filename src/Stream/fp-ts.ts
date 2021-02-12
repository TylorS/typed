import { MonadRec1 } from '@fp/MonadRec'
import {
  ap,
  chain,
  empty,
  filter,
  fromPromise,
  map,
  merge,
  mergeConcurrently,
  multicast,
  now,
  switchLatest,
  take,
} from '@most/core'
import { Stream } from '@most/types'
import { Alt1 } from 'fp-ts/Alt'
import { Alternative1 } from 'fp-ts/Alternative'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Compactable1 } from 'fp-ts/Compactable'
import { Either, isLeft, isRight, Left, left, match, Right, right } from 'fp-ts/Either'
import { Filterable1 } from 'fp-ts/Filterable'
import { FromIO1 } from 'fp-ts/FromIO'
import { FromTask1 } from 'fp-ts/FromTask'
import { pipe, Predicate } from 'fp-ts/function'
import { bindTo as bindTo_, Functor1, tupled as tupled_ } from 'fp-ts/Functor'
import { bind as bind_, Monad1 } from 'fp-ts/Monad'
import { Monoid } from 'fp-ts/Monoid'
import { isSome, Option, Some } from 'fp-ts/Option'
import { Pointed1 } from 'fp-ts/Pointed'
import { Separated } from 'fp-ts/Separated'

export const URI = '@most/core/Stream' as const

export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    [URI]: Stream<A>
  }
}

/**
 * Create a Stream monoid where concat is a parallel merge.
 */
export const getMonoid = <A>(): Monoid<Stream<A>> => {
  return {
    concat: merge,
    empty: empty(),
  }
}

/**
 * Filter Option's from within a Stream
 */
export const compact = <A>(stream: Stream<Option<A>>): Stream<A> =>
  map((s: Some<A>) => s.value, filter(isSome, stream))

/**
 * Separate left and right values
 */
export const separate = <A, B>(stream: Stream<Either<A, B>>): Separated<Stream<A>, Stream<B>> => {
  const s = multicast(stream)
  const left = map((l: Left<A>) => l.left, filter(isLeft, s))
  const right = map((r: Right<B>) => r.right, filter(isRight, s))

  return { left, right }
}

export const partitionMap = <A, B, C>(f: (a: A) => Either<B, C>) => (fa: Stream<A>) =>
  separate(map(f, fa))

export const partition = <A>(predicate: Predicate<A>) =>
  partitionMap((a: A) => (predicate(a) ? right(a) : left(a)))

export const filterMap = <A, B>(f: (a: A) => Option<B>) => (fa: Stream<A>) => compact(map(f, fa))

export const Functor: Functor1<URI> = {
  URI,
  map,
}

export const Pointed: Pointed1<URI> = {
  ...Functor,
  of: now,
}

export const Apply: Apply1<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

export const Monad: Monad1<URI> = {
  ...Functor,
  ...Pointed,
  chain,
}

export const chainRec = <A, B>(f: (value: A) => Stream<Either<A, B>>) => (value: A): Stream<B> =>
  pipe(value, f, chain(match(chainRec(f), now)))

export const MonadRecChain: MonadRec1<URI> = {
  ...Monad,
  chainRec,
}

export const switchRec = <A, B>(f: (value: A) => Stream<Either<A, B>>) => (value: A): Stream<B> =>
  pipe(value, f, map(match(switchRec(f), now)), switchLatest)

export const MonadRecSwitch: MonadRec1<URI> = {
  ...Monad,
  chainRec: switchRec,
}

export const mergeConcurrentlyRec = (concurrency: number) => <A, B>(
  f: (value: A) => Stream<Either<A, B>>,
) => (value: A): Stream<B> =>
  pipe(
    value,
    f,
    map(match(mergeConcurrentlyRec(concurrency)(f), now)),
    mergeConcurrently(concurrency),
  )

export const getConcurrentMonadRec = (concurrency: number): MonadRec1<URI> => ({
  ...Monad,
  chainRec: mergeConcurrentlyRec(concurrency),
})

export const FromIO: FromIO1<URI> = {
  URI,
  fromIO: (f) => Functor.map(f)(now(undefined)),
}

export const fromIO = FromIO.fromIO

export const FromTask: FromTask1<URI> = {
  ...FromIO,
  fromTask: (task) =>
    pipe(
      task,
      now,
      map((t) => fromPromise(t())),
      switchLatest,
    ),
}

export const fromTask = FromTask.fromTask

export const Alt: Alt1<URI> = {
  ...Functor,
  alt: (f) => (fa) => take(1, merge(fa, f())), // race the 2 streams
}

export const alt = Alt.alt

export const Alternative: Alternative1<URI> = {
  ...Alt,
  zero: empty,
}

export const zero = Alternative.zero

export const Compactable: Compactable1<URI> = {
  URI,
  compact,
  separate,
}

export const Filterable: Filterable1<URI> = {
  partitionMap,
  partition,
  filterMap,
  filter,
}

export const Do: Stream<{}> = pipe(null, now, map(Object.create))
export const bindTo = bindTo_(Functor)
export const bind = bind_(Monad)
export const tupled = tupled_(Functor)

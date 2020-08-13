import * as M from '@most/core'
import { Stream } from '@most/types'
import { Alternative1 } from 'fp-ts/es6/Alternative'
import { Separated } from 'fp-ts/es6/Compactable'
import { Either, isLeft, isRight, Left, left, Right, right } from 'fp-ts/es6/Either'
import { Filterable1 } from 'fp-ts/es6/Filterable'
import { Predicate } from 'fp-ts/es6/function'
import { Monad1 } from 'fp-ts/es6/Monad'
import { Monoid } from 'fp-ts/es6/Monoid'
import { isSome, Option, Some } from 'fp-ts/es6/Option'
import { pipeable } from 'fp-ts/es6/pipeable'
import { take, merge } from '@most/core'

export const URI = '@most/core:Stream' as const
export type URI = typeof URI

declare module 'fp-ts/es6/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Stream<A>
  }
}

export const getMonoid = <A>(): Monoid<Stream<A>> => {
  return {
    concat: M.merge,
    empty: M.empty(),
  }
}

export const compact = <A>(stream: Stream<Option<A>>): Stream<A> =>
  M.map((s: Some<A>) => s.value, M.filter(isSome, stream))

export const separate = <A, B>(stream: Stream<Either<A, B>>): Separated<Stream<A>, Stream<B>> => {
  const s = M.multicast(stream)
  const left = M.map((l: Left<A>) => l.left, M.filter(isLeft, s))
  const right = M.map((r: Right<B>) => r.right, M.filter(isRight, s))

  return { left, right }
}

const _partitionMap = <A, B, C>(fa: Stream<A>, f: (a: A) => Either<B, C>) => separate(M.map(f, fa))
const _filterMap = <A, B>(fa: Stream<A>, f: (a: A) => Option<B>) => compact(M.map(f, fa))

export const stream: Monad1<URI> & Alternative1<URI> & Filterable1<URI> = {
  URI,
  map: (fa, f) => M.map(f, fa),
  of: M.now,
  ap: M.ap,
  chain: (fa, f) => M.chain(f, fa),
  zero: M.empty,
  alt: (fa, f) => take(1, merge(fa, f())), // race the 2 streams
  compact,
  separate,
  partitionMap: _partitionMap,
  partition: <A>(fa: Stream<A>, predicate: Predicate<A>) =>
    _partitionMap(fa, (a) => (predicate(a) ? right(a) : left(a))),
  filterMap: _filterMap,
  filter: <A>(fa: Stream<A>, p: Predicate<A>) => M.filter(p, fa),
}

export const {
  alt,
  ap,
  apFirst,
  apSecond,
  chain,
  chainFirst,
  flatten,
  map,
  filter,
  filterMap,
  partition,
  partitionMap,
} = pipeable(stream)

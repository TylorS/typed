import * as M from '@most/core'
import { merge, take } from '@most/core'
import { Stream } from '@most/types'
import { Alternative1 } from 'fp-ts/Alternative'
import { Separated } from 'fp-ts/Compactable'
import { Either, isLeft, isRight, Left, left, Right, right } from 'fp-ts/Either'
import { Filterable1 } from 'fp-ts/Filterable'
import { Predicate } from 'fp-ts/function'
import { Monad1 } from 'fp-ts/Monad'
import { Monoid } from 'fp-ts/Monoid'
import { isSome, Option, Some } from 'fp-ts/Option'
import { pipeable } from 'fp-ts/pipeable'

export const URI = '@most/core/Stream' as const

export type URI = typeof URI

declare module 'fp-ts/HKT' {
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

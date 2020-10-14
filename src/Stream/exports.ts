import { ap, chain, empty, filter, map, merge, multicast, now, take } from '@most/core'
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
    concat: merge,
    empty: empty(),
  }
}

export const compact = <A>(stream: Stream<Option<A>>): Stream<A> =>
  map((s: Some<A>) => s.value, filter(isSome, stream))

export const separate = <A, B>(stream: Stream<Either<A, B>>): Separated<Stream<A>, Stream<B>> => {
  const s = multicast(stream)
  const left = map((l: Left<A>) => l.left, filter(isLeft, s))
  const right = map((r: Right<B>) => r.right, filter(isRight, s))

  return { left, right }
}

const _partitionMap = <A, B, C>(fa: Stream<A>, f: (a: A) => Either<B, C>) => separate(map(f, fa))
const _filterMap = <A, B>(fa: Stream<A>, f: (a: A) => Option<B>) => compact(map(f, fa))

export const stream: Monad1<URI> & Alternative1<URI> & Filterable1<URI> = {
  URI,
  map: (fa, f) => map(f, fa),
  of: now,
  ap,
  chain: (fa, f) => chain(f, fa),
  zero: empty,
  alt: (fa, f) => take(1, merge(fa, f())), // race the 2 streams
  compact,
  separate,
  partitionMap: _partitionMap,
  partition: <A>(fa: Stream<A>, predicate: Predicate<A>) =>
    _partitionMap(fa, (a) => (predicate(a) ? right(a) : left(a))),
  filterMap: _filterMap,
  filter: <A>(fa: Stream<A>, p: Predicate<A>) => filter(p, fa),
}

export const { alt, apFirst, apSecond, chainFirst, filterMap, partition, partitionMap } = pipeable(
  stream,
)

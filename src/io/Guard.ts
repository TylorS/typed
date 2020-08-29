import { Either } from 'fp-ts/es6/Either'
import { Option } from 'fp-ts/es6/Option'
import { Int } from 'io-ts'
import * as G from 'io-ts/es6/Guard'

import { Progress, RemoteData, RemoteDataStatus } from '../RemoteData'
import { Uuid, uuidRegex } from '../Uuid'
import { TypedSchemable1 } from './TypedSchemable'

export const set = <A>(t: G.Guard<unknown, A>): G.Guard<unknown, ReadonlySet<A>> => ({
  is: (u): u is ReadonlySet<A> => u instanceof Set && G.array(t).is(Array.from(u.values())),
})

export const map = <A, B>(k: G.Guard<unknown, A>, v: G.Guard<unknown, B>) => ({
  is: (u: unknown): u is ReadonlyMap<A, B> =>
    u instanceof Map &&
    G.array(k).is(Array.from(u.keys())) &&
    G.array(v).is(Array.from(u.values())),
})

export const option = <A>(v: G.Guard<unknown, A>): G.Guard<unknown, Option<A>> =>
  G.union(G.type({ _tag: G.literal('None') }), G.type({ _tag: G.literal('Some'), value: v }))

export const either = <A, B>(
  left: G.Guard<unknown, A>,
  right: G.Guard<unknown, B>,
): G.Guard<unknown, Either<A, B>> =>
  G.union(G.type({ _tag: G.literal('Left'), left }), G.type({ _tag: G.literal('Right'), right }))

export const remoteData = <A, B>(
  left: G.Guard<unknown, A>,
  right: G.Guard<unknown, B>,
): G.Guard<unknown, RemoteData<A, B>> =>
  G.union(
    G.type({ status: G.literal(RemoteDataStatus.NoData) }),
    G.type({ status: G.literal(RemoteDataStatus.Loading), progress: option(progress) }),
    G.type({ status: G.literal(RemoteDataStatus.Failure), value: left }),
    G.type({ status: G.literal(RemoteDataStatus.Success), value: right }),
    G.type({
      status: G.literal(RemoteDataStatus.RefreshingFailure),
      value: left,
      progress: option(progress),
    }),
    G.type({
      status: G.literal(RemoteDataStatus.RefreshingSuccess),
      value: right,
      progress: option(progress),
    }),
  )

export const date: G.Guard<unknown, Date> = {
  is: (u): u is Date => u instanceof Date && u.getTime() > 0,
}

export const uuid: G.Guard<unknown, Uuid> = {
  is: (u): u is Uuid => G.string.is(u) && uuidRegex.test(u),
}

export const int: G.Guard<unknown, Int> = {
  is: (u): u is Int => G.number.is(u) && Math.floor(u) === u,
}

export const bigint: G.Guard<unknown, BigInt> = {
  is: (u): u is BigInt => u instanceof BigInt,
}

export const progress: G.Guard<unknown, Progress> = G.type({
  loaded: G.number,
  total: option(G.number),
})

export const unknown: G.Guard<unknown, unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  is: (_u): _u is unknown => true,
}

export const Schemable: TypedSchemable1<G.URI> = {
  ...G.Schemable,
  set,
  map,
  option,
  either,
  remoteData,
  date,
  uuid,
  int,
  bigint,
  union: G.union as TypedSchemable1<G.URI>['union'],
  refine: G.refine as TypedSchemable1<G.URI>['refine'],
  unknown,
  newtype: (from) => from,
}

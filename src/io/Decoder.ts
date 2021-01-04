import { Progress, RemoteData, RemoteDataStatus } from '@fp/RemoteData/exports'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/pipeable'
import { leaf } from 'io-ts/DecodeError'
import * as D from 'io-ts/Decoder'
import * as FS from 'io-ts/FreeSemigroup'
import { WithRefine2C, WithUnion2C } from 'io-ts/lib/Schemable'
import { AnyNewtype, CarrierOf } from 'newtype-ts'

import { Match } from '../logic/types'
import * as G from './Guard'
import { TypedSchemable2C, WithNever2C, WithUnknown2C } from './TypedSchemable'

/**
 * Create a Decoder instance for a Set
 */
export const set = <A>(from: D.Decoder<unknown, A>): D.Decoder<unknown, ReadonlySet<A>> => {
  const array = D.array(from)

  return {
    decode: (i) => {
      if (!(i instanceof Set)) {
        return E.left(FS.of(leaf(i, `Expected Set`)))
      }

      const values = Array.from(i.values())
      const either = array.decode(values)

      return pipe(
        either,
        E.map(() => i),
      )
    },
  }
}

/**
 * Create a Decoder instance for a Map<K, V>
 */
export const map = <A, B>(
  key: D.Decoder<unknown, A>,
  value: D.Decoder<unknown, B>,
): D.Decoder<unknown, ReadonlyMap<A, B>> => {
  const keysD = D.array(key)
  const valuesD = D.array(value)

  return {
    decode: (i) => {
      if (!(i instanceof Map)) {
        return E.left(FS.of(leaf(i, `Expected Map`)))
      }

      const keys = Array.from(i.keys())
      const values = Array.from(i.values())

      return pipe(
        keysD.decode(keys),
        E.chain(() => valuesD.decode(values)),
        E.map(() => i),
      )
    },
  }
}

/**
 * Create a Decoder instance for Option<A>
 */
export const option = <A>(v: D.Decoder<unknown, A>): D.Decoder<unknown, O.Option<A>> =>
  D.union(D.type({ _tag: D.literal('None') }), D.type({ _tag: D.literal('Some'), value: v }))

/**
 * Create a Decoder instance for Either<A, B>
 */
export const either = <A, B>(
  left: D.Decoder<unknown, A>,
  right: D.Decoder<unknown, B>,
): D.Decoder<unknown, E.Either<A, B>> =>
  D.union(D.type({ _tag: D.literal('Left'), left }), D.type({ _tag: D.literal('Right'), right }))

/**
 * A Decoder instance for RemoteData Progress
 */
export const progress: D.Decoder<unknown, Progress> = D.type({
  loaded: D.number,
  total: option(D.number),
})

/**
 * A Decoder instance for RemoteData
 */
export const remoteData = <A, B>(
  left: D.Decoder<unknown, A>,
  right: D.Decoder<unknown, B>,
): D.Decoder<unknown, RemoteData<A, B>> =>
  D.union(
    D.type({ status: D.literal(RemoteDataStatus.NoData) }),
    D.type({ status: D.literal(RemoteDataStatus.Loading), progress: option(progress) }),
    D.type({ status: D.literal(RemoteDataStatus.Failure), value: left }),
    D.type({ status: D.literal(RemoteDataStatus.Success), value: right }),
    D.type({
      status: D.literal(RemoteDataStatus.RefreshingFailure),
      value: left,
      progress: option(progress),
    }),
    D.type({
      status: D.literal(RemoteDataStatus.RefreshingSuccess),
      value: right,
      progress: option(progress),
    }),
  )

/**
 * A Decoder TypedSchemable instance
 */
export const Schemable: TypedSchemable2C<D.URI, unknown> &
  WithNever2C<D.URI, unknown> &
  WithUnknown2C<D.URI, unknown> &
  WithRefine2C<D.URI, unknown> &
  WithUnion2C<D.URI, unknown> = {
  ...D.Schemable,
  ...D.WithRefine,
  ...D.WithUnion,
  set,
  map,
  option,
  either,
  remoteData,
  date: D.fromGuard(G.date, `Date`),
  uuid: D.fromGuard(G.uuid, `Uuid`),
  int: D.fromGuard(G.int, `Int`),
  bigint: D.fromGuard(G.bigint, `BigInt`),
  unknown: D.fromGuard(G.unknown, `unknown`),
  never: D.fromGuard(G.Schemable.never, `never`),
  symbol: D.fromGuard(G.Schemable.symbol, `symbol`),
  propertyKey: D.fromGuard(G.Schemable.propertyKey, `PropertyKey`),
  json: D.fromGuard(G.Schemable.json, `Json`),
  jsonArray: D.fromGuard(G.Schemable.jsonArray, `JsonArray`),
  jsonPrimitive: D.fromGuard(G.Schemable.jsonPrimitive, `JsonPrimitive`),
  jsonRecord: D.fromGuard(G.Schemable.jsonRecord, `JsonRecord`),
  newtype: <A extends AnyNewtype>(
    from: D.Decoder<unknown, CarrierOf<A>>,
    refine: Match<CarrierOf<A>, A>,
    id: string,
  ) => D.refine((a): a is A => O.isSome(refine(a)), id)(from),
}

import * as E from 'fp-ts/es6/Either'
import * as O from 'fp-ts/es6/Option'
import { pipe } from 'fp-ts/es6/pipeable'
import { leaf } from 'io-ts/es6/DecodeError'
import * as D from 'io-ts/es6/Decoder'
import * as FS from 'io-ts/es6/FreeSemigroup'

import { Progress, RemoteData, RemoteDataStatus } from '@typed/fp/RemoteData'
import * as G from './Guard'
import { TypedSchemable2C } from './TypedSchemable'

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

export const option = <A>(v: D.Decoder<unknown, A>): D.Decoder<unknown, O.Option<A>> =>
  D.union(D.type({ _tag: D.literal('None') }), D.type({ _tag: D.literal('Some'), value: v }))

export const either = <A, B>(
  left: D.Decoder<unknown, A>,
  right: D.Decoder<unknown, B>,
): D.Decoder<unknown, E.Either<A, B>> =>
  D.union(D.type({ _tag: D.literal('Left'), left }), D.type({ _tag: D.literal('Right'), right }))

export const progress: D.Decoder<unknown, Progress> = D.type({
  loaded: D.number,
  total: option(D.number),
})

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

export const Schemable: TypedSchemable2C<D.URI, unknown> = {
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
  json: D.fromGuard(G.Schemable.json, `Json`),
  jsonArray: D.fromGuard(G.Schemable.jsonArray, `JsonArray`),
  jsonPrimitive: D.fromGuard(G.Schemable.jsonPrimitive, `JsonPrimitive`),
  jsonRecord: D.fromGuard(G.Schemable.jsonRecord, `JsonRecord`),
  newtype: (from, refine, id) => D.refine(refine, id)(from),
}

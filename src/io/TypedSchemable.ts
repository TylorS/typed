import type { Match } from '@typed/fp/logic/types'
import type { RemoteData } from '@typed/fp/RemoteData/exports'
import type { Uuid } from '@typed/fp/Uuid/exports'
import type { Either, Json, JsonArray, JsonRecord } from 'fp-ts/Either'
import type { Refinement } from 'fp-ts/function'
import type { HKT, Kind, Kind2, URIS, URIS2 } from 'fp-ts/HKT'
import type { Option } from 'fp-ts/Option'
import type { Int } from 'io-ts'
import type {
  Schemable,
  Schemable1,
  Schemable2C,
  WithRefine,
  WithRefine1,
  WithRefine2C,
  WithUnion,
  WithUnion1,
  WithUnion2C,
} from 'io-ts/Schemable'
import type { AnyNewtype, CarrierOf } from 'newtype-ts'

export interface TypedSchemable<S> extends Schemable<S>, WithUnion<S>, WithRefine<S> {
  readonly set: <A>(hkt: HKT<S, A>) => HKT<S, ReadonlySet<A>>
  readonly map: <A, B>(key: HKT<S, A>, value: HKT<S, B>) => HKT<S, ReadonlyMap<A, B>>
  readonly option: <A>(hkt: HKT<S, A>) => HKT<S, Option<A>>
  readonly either: <A, B>(left: HKT<S, A>, right: HKT<S, B>) => HKT<S, Either<A, B>>
  readonly remoteData: <A, B>(left: HKT<S, A>, right: HKT<S, B>) => HKT<S, RemoteData<A, B>>
  readonly date: HKT<S, Date>
  readonly uuid: HKT<S, Uuid>
  readonly int: HKT<S, Int>
  readonly bigint: HKT<S, BigInt>
  readonly unknown: HKT<S, unknown>
  readonly never: HKT<S, never>
  readonly symbol: HKT<S, symbol>
  readonly json: HKT<S, Json>
  readonly jsonRecord: HKT<S, JsonRecord>
  readonly jsonArray: HKT<S, JsonArray>
  readonly jsonPrimitive: HKT<S, string | number | boolean | null>
  readonly newtype: <N extends AnyNewtype>(
    from: HKT<S, CarrierOf<N>>,
    refinement: Match<CarrierOf<N>, N>,
    id: string,
  ) => HKT<S, N>
}

export interface TypedSchemable1<S extends URIS>
  extends Schemable1<S>,
    WithUnion1<S>,
    WithRefine1<S> {
  readonly set: <A>(hkt: Kind<S, A>) => Kind<S, ReadonlySet<A>>
  readonly map: <A, B>(key: Kind<S, A>, value: Kind<S, B>) => Kind<S, ReadonlyMap<A, B>>
  readonly option: <A>(Kind: Kind<S, A>) => Kind<S, Option<A>>
  readonly either: <A, B>(left: Kind<S, A>, right: Kind<S, B>) => Kind<S, Either<A, B>>
  readonly remoteData: <A, B>(left: Kind<S, A>, right: Kind<S, B>) => Kind<S, RemoteData<A, B>>
  readonly date: Kind<S, Date>
  readonly uuid: Kind<S, Uuid>
  readonly int: Kind<S, Int>
  readonly bigint: Kind<S, BigInt>
  readonly unknown: Kind<S, unknown>
  readonly never: Kind<S, never>
  readonly symbol: Kind<S, symbol>
  readonly json: Kind<S, Json>
  readonly jsonRecord: Kind<S, JsonRecord>
  readonly jsonArray: Kind<S, JsonArray>
  readonly jsonPrimitive: Kind<S, string | number | boolean | null>
  readonly newtype: <N extends AnyNewtype>(
    from: Kind<S, CarrierOf<N>>,
    refinement: Refinement<unknown, N>,
    id: string,
  ) => Kind<S, N>
}

export interface TypedSchemable2C<S extends URIS2, E>
  extends Schemable2C<S, E>,
    WithUnion2C<S, E>,
    WithRefine2C<S, E> {
  readonly set: <A>(hkt: Kind2<S, E, A>) => Kind2<S, E, ReadonlySet<A>>
  readonly map: <A, B>(key: Kind2<S, E, A>, value: Kind2<S, E, B>) => Kind2<S, E, ReadonlyMap<A, B>>
  readonly option: <A>(k: Kind2<S, E, A>) => Kind2<S, E, Option<A>>
  readonly either: <A, B>(left: Kind2<S, E, A>, right: Kind2<S, E, B>) => Kind2<S, E, Either<A, B>>
  readonly remoteData: <A, B>(
    left: Kind2<S, E, A>,
    right: Kind2<S, E, B>,
  ) => Kind2<S, E, RemoteData<A, B>>
  readonly date: Kind2<S, E, Date>
  readonly uuid: Kind2<S, E, Uuid>
  readonly int: Kind2<S, E, Int>
  readonly bigint: Kind2<S, E, BigInt>
  readonly unknown: Kind2<S, E, unknown>
  readonly never: Kind2<S, E, never>
  readonly symbol: Kind2<S, E, symbol>
  readonly json: Kind2<S, E, Json>
  readonly jsonRecord: Kind2<S, E, JsonRecord>
  readonly jsonArray: Kind2<S, E, JsonArray>
  readonly jsonPrimitive: Kind2<S, E, string | number | boolean | null>
  readonly newtype: <N extends AnyNewtype>(
    from: Kind2<S, E, CarrierOf<N>>,
    refinement: Refinement<unknown, N>,
    id: string,
  ) => Kind2<S, E, N>
}

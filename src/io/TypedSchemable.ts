import type { Match } from '@fp/logic/exports'
import type { RemoteData } from '@fp/RemoteData/exports'
import type { Uuid } from '@fp/Uuid/exports'
import type { Either, Json, JsonArray, JsonRecord } from 'fp-ts/Either'
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

/**
 * A Schemable interface with union, and many other common data types
 * including Option, Either, RemoteData and more.
 */
export interface TypedSchemable<S> extends Schemable<S>, WithUnion<S> {
  readonly set: <A>(hkt: HKT<S, A>) => HKT<S, ReadonlySet<A>>
  readonly map: <A, B>(key: HKT<S, A>, value: HKT<S, B>) => HKT<S, ReadonlyMap<A, B>>
  readonly option: <A>(hkt: HKT<S, A>) => HKT<S, Option<A>>
  readonly either: <A, B>(left: HKT<S, A>, right: HKT<S, B>) => HKT<S, Either<A, B>>
  readonly remoteData: <A, B>(left: HKT<S, A>, right: HKT<S, B>) => HKT<S, RemoteData<A, B>>
  readonly date: HKT<S, Date>
  readonly uuid: HKT<S, Uuid>
  readonly int: HKT<S, Int>
  readonly bigint: HKT<S, BigInt>
  readonly symbol: HKT<S, symbol>
  readonly propertyKey: HKT<S, PropertyKey>
  readonly json: HKT<S, Json>
  readonly jsonRecord: HKT<S, JsonRecord>
  readonly jsonArray: HKT<S, JsonArray>
  readonly jsonPrimitive: HKT<S, string | number | boolean | null>
  readonly newtype: <A extends AnyNewtype>(
    from: HKT<S, CarrierOf<A>>,
    refine: Match<CarrierOf<A>, A>,
    id: string,
  ) => HKT<S, A>
}

export interface TypedSchemable1<S extends URIS> extends Schemable1<S>, WithUnion1<S> {
  readonly set: <A>(hkt: Kind<S, A>) => Kind<S, ReadonlySet<A>>
  readonly map: <A, B>(key: Kind<S, A>, value: Kind<S, B>) => Kind<S, ReadonlyMap<A, B>>
  readonly option: <A>(Kind: Kind<S, A>) => Kind<S, Option<A>>
  readonly either: <A, B>(left: Kind<S, A>, right: Kind<S, B>) => Kind<S, Either<A, B>>
  readonly remoteData: <A, B>(left: Kind<S, A>, right: Kind<S, B>) => Kind<S, RemoteData<A, B>>
  readonly date: Kind<S, Date>
  readonly uuid: Kind<S, Uuid>
  readonly int: Kind<S, Int>
  readonly bigint: Kind<S, BigInt>
  readonly symbol: Kind<S, symbol>
  readonly propertyKey: Kind<S, PropertyKey>
  readonly json: Kind<S, Json>
  readonly jsonRecord: Kind<S, JsonRecord>
  readonly jsonArray: Kind<S, JsonArray>
  readonly jsonPrimitive: Kind<S, string | number | boolean | null>
  readonly newtype: <A extends AnyNewtype>(
    from: Kind<S, CarrierOf<A>>,
    refine: Match<CarrierOf<A>, A>,
    id: string,
  ) => Kind<S, A>
}

export interface TypedSchemable2C<S extends URIS2, E> extends Schemable2C<S, E>, WithUnion2C<S, E> {
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
  readonly symbol: Kind2<S, E, symbol>
  readonly propertyKey: Kind2<S, E, PropertyKey>
  readonly json: Kind2<S, E, Json>
  readonly jsonRecord: Kind2<S, E, JsonRecord>
  readonly jsonArray: Kind2<S, E, JsonArray>
  readonly jsonPrimitive: Kind2<S, E, string | number | boolean | null>
  readonly newtype: <A extends AnyNewtype>(
    from: Kind2<S, E, CarrierOf<A>>,
    refine: Match<CarrierOf<A>, A>,
    id: string,
  ) => Kind2<S, E, A>
}

export interface WithUnknown<S> {
  readonly unknown: HKT<S, unknown>
}

export interface WithUnknown1<S extends URIS> {
  readonly unknown: Kind<S, unknown>
}

export interface WithUnknown2C<S extends URIS2, E> {
  readonly unknown: Kind2<S, E, unknown>
}

export interface WithNever<S> {
  readonly never: HKT<S, never>
}

export interface WithNever1<S extends URIS> {
  readonly never: Kind<S, never>
}

export interface WithNever2C<S extends URIS2, E> {
  readonly never: Kind2<S, E, never>
}

export interface RuntimeSchemable<S>
  extends TypedSchemable<S>,
    WithRefine<S>,
    WithUnknown<S>,
    WithNever<S> {}

export interface RuntimeSchemable1<S extends URIS>
  extends TypedSchemable1<S>,
    WithRefine1<S>,
    WithUnknown1<S>,
    WithNever1<S> {}

export interface RuntimeSchemable2C<S extends URIS2, E>
  extends TypedSchemable2C<S, E>,
    WithRefine2C<S, E>,
    WithUnknown2C<S, E>,
    WithNever2C<S, E> {}

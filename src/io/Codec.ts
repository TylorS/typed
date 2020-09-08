import { Codec, fromDecoder } from 'io-ts/es6/Codec'

import * as D from './Decoder'
import { TypedSchemable1 } from './TypedSchemable'

export const URI = 'io-ts/Codec'
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Codec<unknown, A, A>
  }
}

declare module 'fp-ts/es6/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Codec<unknown, A, A>
  }
}

export const Schemable: TypedSchemable1<URI> = {
  URI,
  set: (type) => fromDecoder(D.Schemable.set(type)),
  map: (key, value) => fromDecoder(D.Schemable.map(key, value)),
  option: (value) => fromDecoder(D.Schemable.option(value)),
  either: (l, r) => fromDecoder(D.Schemable.either(l, r)),
  remoteData: (l, r) => fromDecoder(D.Schemable.remoteData(l, r)),
  date: fromDecoder(D.Schemable.date),
  uuid: fromDecoder(D.Schemable.uuid),
  int: fromDecoder(D.Schemable.int),
  bigint: fromDecoder(D.Schemable.bigint),
  unknown: fromDecoder(D.Schemable.unknown),
  never: fromDecoder(D.Schemable.never),
  json: fromDecoder(D.Schemable.json),
  jsonArray: fromDecoder(D.Schemable.jsonArray),
  jsonPrimitive: fromDecoder(D.Schemable.jsonPrimitive),
  jsonRecord: fromDecoder(D.Schemable.jsonRecord),
  newtype: (f, r, id) => fromDecoder(D.Schemable.newtype(f, r, id)),
  literal: (...literals) => fromDecoder(D.Schemable.literal(...literals)),
  string: fromDecoder(D.Schemable.string),
  number: fromDecoder(D.Schemable.number),
  boolean: fromDecoder(D.Schemable.boolean),
  nullable: (or) => fromDecoder(D.Schemable.nullable(or)),
  type: (props) => fromDecoder(D.Schemable.type(props)),
  partial: (props) => fromDecoder(D.Schemable.partial(props)),
  record: (codomain) => fromDecoder(D.Schemable.record(codomain)),
  array: (item) => fromDecoder(D.Schemable.array(item)),
  tuple: ((...items) => fromDecoder(D.Schemable.tuple(...items))) as TypedSchemable1<URI>['tuple'],
  intersect: (right) => (left) => fromDecoder(D.Schemable.intersect(right)(left)),
  sum: (tag) => (members) => fromDecoder(D.Schemable.sum(tag)(members)),
  lazy: (id, f) => fromDecoder(D.Schemable.lazy(id, f)),
  union: (...members) => fromDecoder(D.Schemable.union(...(members as any))),
  refine: (refine, id) => (from) => fromDecoder(D.Schemable.refine(refine, id)(from)),
}

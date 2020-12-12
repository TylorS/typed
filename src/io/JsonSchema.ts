import { JSON_TAG, JsonTag, VALUES_TAG } from '@typed/fp/logic/json'
import {
  Failure,
  Loading,
  NoData,
  Progress,
  RefreshingFailure,
  RefreshingSuccess,
  RemoteData,
  RemoteDataStatus,
  Success,
} from '@typed/fp/RemoteData/exports'
import { Const, make } from 'fp-ts/Const'
import { Either, Left, Right } from 'fp-ts/Either'
import { Endomorphism, flow, pipe } from 'fp-ts/function'
import { isSome, none, Option, some } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { map as mapRecord } from 'fp-ts/Record'
import { Int } from 'io-ts'
import { Literal, Schemable1 } from 'io-ts/Schemable'
import { JSONSchema7 } from 'json-schema'

import { Uuid, uuidRegex } from '../Uuid/exports'
import { TypedSchemable1 } from './TypedSchemable'

/* JSON-Schema representation of your models */

export interface JsonSchema<A> {
  readonly createSchema: Reader<JSONSchema7, Const<JSONSchema7, A>>
}

export type JsonSchemaValue<A> = [A] extends [JsonSchema<infer R>] ? R : never

export const jsonSchema = <A>(f: Endomorphism<JSONSchema7>): JsonSchema<A> => ({
  createSchema: flow(f, make),
})

export namespace JsonSchema {
  export const of = <A>(schema: JSONSchema7): JsonSchema<A> =>
    jsonSchema((o) => ({ ...o, ...schema }))
}

export const URI = '@typed/fp/io/JsonSchema'
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  export interface URItoKind<A> {
    [URI]: JsonSchema<A>
  }
}

export const number = JsonSchema.of<number>({ type: 'number' })
export const string = JsonSchema.of<string>({ type: 'string' })
export const boolean = JsonSchema.of<boolean>({ type: 'boolean' })

export const lazy = <A>(_: string, f: () => JsonSchema<A>): JsonSchema<A> => {
  let schema: Option<JsonSchema<A>> = none

  return {
    createSchema: (o) => {
      if (isSome(schema)) {
        return schema.value.createSchema(o)
      }

      const jsonSchema = f()

      schema = some(jsonSchema)

      return jsonSchema.createSchema(o)
    },
  }
}

export const type = <A>(props: { readonly [K in keyof A]: JsonSchema<A[K]> }): JsonSchema<A> =>
  JsonSchema.of({
    type: 'object',
    properties: pipe(
      props,
      mapRecord((a: JsonSchema<unknown>) => a.createSchema({})),
    ),
    required: Object.keys(props),
  })

export const union = <A extends readonly JsonSchema<any>[]>(
  ...values: A
): JsonSchema<JsonSchemaValue<A[number]>> =>
  JsonSchema.of({ anyOf: values.map((v) => v.createSchema({})) })

export const literal = <A extends readonly Literal[]>(...values: A): JsonSchema<A[number]> =>
  JsonSchema.of({ anyOf: values.map(literalToJsonSchema) })

const literalToJsonSchema = (literal: Literal): JSONSchema7 => {
  if (literal === null) {
    return { type: 'null' }
  }

  const type = typeof literal

  switch (type) {
    case 'string':
    case 'number':
    case 'boolean':
      return { type, enum: [literal] }
    default:
      throw new Error('Unsupported literal')
  }
}

export const option = <A>(k: JsonSchema<A>): JsonSchema<Option<A>> =>
  union(type({ _tag: literal('None') }), type({ _tag: literal('Some'), value: k }))

export const array = <A>(item: JsonSchema<A>): JsonSchema<ReadonlyArray<A>> =>
  JsonSchema.of({ type: 'array', items: item.createSchema({}) })

// Encoding for Set as defined by @typed/fp/logic/json
export const set = <A>(a: JsonSchema<A>): JsonSchema<ReadonlySet<A>> =>
  JsonSchema.of({
    type: 'object',
    properties: {
      [JSON_TAG]: number.createSchema({ enum: [JsonTag.Set] }),
      [VALUES_TAG]: array(a).createSchema({}),
    },
  })

export const tuple = <A extends ReadonlyArray<any>>(
  ...items: { readonly [K in keyof A]: JsonSchema<A[K]> }
): JsonSchema<A> => JsonSchema.of({ type: 'array', items: items.map((i) => i.createSchema({})) })

// Encoding for Map as defined by @typed/fp/logic/json
export const map = <K, V>(k: JsonSchema<K>, v: JsonSchema<V>): JsonSchema<ReadonlyMap<K, V>> =>
  JsonSchema.of({
    type: 'object',
    properties: {
      [JSON_TAG]: number.createSchema({ enum: [JsonTag.Map] }),
      [VALUES_TAG]: array(tuple(k, v)).createSchema({}),
    },
  })

export const either = <A, B>(left: JsonSchema<A>, right: JsonSchema<B>): JsonSchema<Either<A, B>> =>
  union(
    type<Left<A>>({ _tag: literal('Left'), left }),
    type<Right<B>>({ _tag: literal('Right'), right }),
  )

export const remoteData = <A, B>(
  left: JsonSchema<A>,
  right: JsonSchema<B>,
): JsonSchema<RemoteData<A, B>> =>
  union(
    type<NoData>({ status: literal(RemoteDataStatus.NoData) }),
    type<Loading>({
      status: literal(RemoteDataStatus.Loading),
      progress: option(progress),
    }),
    type<Failure<A>>({
      status: literal(RemoteDataStatus.Failure),
      value: left,
    }),
    type<Success<B>>({
      status: literal(RemoteDataStatus.Success),
      value: right,
    }),
    type<RefreshingFailure<A>>({
      status: literal(RemoteDataStatus.RefreshingFailure),
      value: left,
      progress: option(progress),
    }),
    type<RefreshingSuccess<B>>({
      status: literal(RemoteDataStatus.RefreshingSuccess),
      value: right,
      progress: option(progress),
    }),
  )

export const progress: JsonSchema<Progress> = type({
  loaded: number,
  total: option(number),
})

export const date = JsonSchema.of<Date>({ type: 'string', format: 'date-time' })

export const uuid = JsonSchema.of<Uuid>({ type: 'string', pattern: uuidRegex.toString() })

export const int = JsonSchema.of<Int>({ type: 'integer' })

export const bigint = JsonSchema.of<BigInt>({
  type: 'object',
  properties: {
    [JSON_TAG]: number.createSchema({ enum: [JsonTag.BigInt] }),
    [VALUES_TAG]: number.createSchema({}),
  },
})

// Encoding for Symbol as defined by @typed/fp/logic/json
export const symbol = JsonSchema.of<symbol>({
  type: 'object',
  properties: {
    [JSON_TAG]: number.createSchema({ enum: [JsonTag.Symbol, JsonTag.SymbolFor] }),
    [VALUES_TAG]: string.createSchema({}),
  },
})

export const propertyKey: JsonSchema<PropertyKey> = union(string, number, symbol)

export const nullable = <A>(or: JsonSchema<A>): JsonSchema<A | null> =>
  jsonSchema((o) => ({ anyOf: [or.createSchema(o), { type: 'null' }] }))

export const Schemable: TypedSchemable1<URI> = {
  URI,
  literal,
  string,
  number,
  boolean,
  nullable,
  type,
  partial: (props) =>
    JsonSchema.of({
      type: 'object',
      properties: pipe(
        props,
        mapRecord((a: JsonSchema<unknown>) => a.createSchema({})),
      ),
    }),
  intersect: (right) => (left) =>
    JsonSchema.of({ allOf: [left.createSchema({}), right.createSchema({})] }),
  record: (co) => JsonSchema.of({ type: 'object', additionalProperties: co.createSchema({}) }),
  array: array as TypedSchemable1<URI>['array'],
  tuple: tuple as TypedSchemable1<URI>['tuple'],
  sum: (() => (members) => union(...members)) as Schemable1<URI>['sum'],
  lazy,
  set,
  map,
  option,
  either,
  remoteData,
  date,
  uuid,
  int,
  bigint,
  symbol,
  propertyKey,
  jsonRecord: JsonSchema.of({ type: 'object' }),
  jsonArray: JsonSchema.of({ type: 'array' }),
  jsonPrimitive: nullable(union(string, number, boolean)),
  json: lazy('Json', () =>
    union(Schemable.jsonRecord, Schemable.jsonArray, Schemable.jsonPrimitive),
  ),
  union,
  newtype: (from) => from,
}

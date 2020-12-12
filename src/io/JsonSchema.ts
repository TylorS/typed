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
import { isSome, None, none, Option, Some, some } from 'fp-ts/Option'
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

export const type = <A>(props: { readonly [K in keyof A]: JsonSchema<A[K]> }): JsonSchema<A> =>
  JsonSchema.of({
    type: 'object',
    properties: pipe(
      props,
      mapRecord((a: JsonSchema<unknown>) => a.createSchema({})),
    ),
    required: Object.keys(props),
  })

export const option = <A>(k: JsonSchema<A>): JsonSchema<Option<A>> =>
  union(
    JsonSchema.of<None>({
      type: 'object',
      properties: { _tag: Schemable.literal('None').createSchema({}) },
    }),
    JsonSchema.of<Some<A>>({
      type: 'object',
      properties: { _tag: Schemable.literal('Some').createSchema({}), value: k.createSchema({}) },
    }),
  )

// Encoding for Set as defined by @typed/fp/logic/json
export const set = <A>(a: JsonSchema<A>): JsonSchema<ReadonlySet<A>> =>
  JsonSchema.of({
    type: 'object',
    properties: {
      [JSON_TAG]: number.createSchema({ enum: [JsonTag.Set] }),
      [VALUES_TAG]: Schemable.array(a).createSchema({}),
    },
  })

// Encoding for Map as defined by @typed/fp/logic/json
export const map = <K, V>(k: JsonSchema<K>, v: JsonSchema<V>): JsonSchema<ReadonlyMap<K, V>> =>
  JsonSchema.of({
    type: 'object',
    properties: {
      [JSON_TAG]: number.createSchema({ enum: [JsonTag.Map] }),
      [VALUES_TAG]: Schemable.array(Schemable.tuple(k, v)).createSchema({}),
    },
  })

export const either = <A, B>(left: JsonSchema<A>, right: JsonSchema<B>): JsonSchema<Either<A, B>> =>
  union(
    Schemable.type<Left<A>>({ _tag: Schemable.literal('Left'), left }),
    Schemable.type<Right<B>>({ _tag: Schemable.literal('Right'), right }),
  )

export const remoteData = <A, B>(
  left: JsonSchema<A>,
  right: JsonSchema<B>,
): JsonSchema<RemoteData<A, B>> =>
  union(
    Schemable.type<NoData>({ status: Schemable.literal(RemoteDataStatus.NoData) }),
    Schemable.type<Loading>({
      status: Schemable.literal(RemoteDataStatus.Loading),
      progress: option(progress),
    }),
    Schemable.type<Failure<A>>({
      status: Schemable.literal(RemoteDataStatus.Failure),
      value: left,
    }),
    Schemable.type<Success<B>>({
      status: Schemable.literal(RemoteDataStatus.Success),
      value: right,
    }),
    Schemable.type<RefreshingFailure<A>>({
      status: Schemable.literal(RemoteDataStatus.RefreshingFailure),
      value: left,
      progress: option(progress),
    }),
    Schemable.type<RefreshingSuccess<B>>({
      status: Schemable.literal(RemoteDataStatus.RefreshingSuccess),
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
  array: (item) => JsonSchema.of({ type: 'array', items: item.createSchema({}) }),
  tuple: (...items) =>
    JsonSchema.of({ type: 'array', items: items.map((i) => i.createSchema({})) }),
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

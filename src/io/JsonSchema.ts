import { Const, make } from 'fp-ts/Const'
import { flow, pipe } from 'fp-ts/function'
import { isSome, none, Option, some } from 'fp-ts/lib/Option'
import { map } from 'fp-ts/lib/Record'
import { Reader } from 'fp-ts/Reader'
import { Literal, Schemable2C, WithRefine2C, WithUnion2C } from 'io-ts/Schemable'
import { JSONSchema7 } from 'json-schema'

export interface JsonSchema<E, A> {
  readonly make: Reader<E, Const<JSONSchema7, A>>
}

export const jsonSchema = <A>(
  f: (options: Partial<JSONSchema7>) => JSONSchema7,
): JsonSchema<Partial<JSONSchema7>, A> => ({ make: flow(f, make) })

export namespace JsonSchema {
  export const of = <A>(schema: JSONSchema7): JsonSchema<Partial<JSONSchema7>, A> =>
    jsonSchema((o) => ({ ...o, ...schema }))
}

export const URI = '@typed/fp/io/JsonSchema'
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: JsonSchema<E, A>
  }
}

export const union = <A extends readonly JsonSchema<Partial<JSONSchema7>, any>[]>(
  ...values: A
): JsonSchema<Partial<JSONSchema7>, A[number]> =>
  jsonSchema((o) => ({ ...o, anyOf: values.map((v) => v.make({})) }))

export const literal = <A extends readonly Literal[]>(
  ...values: A
): JsonSchema<Partial<JSONSchema7>, A[number]> =>
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

export const Schemable: Schemable2C<URI, Partial<JSONSchema7>> = {
  URI,
  literal,
  string: JsonSchema.of({ type: 'string' }),
  number: JsonSchema.of({ type: 'number' }),
  boolean: JsonSchema.of({ type: 'boolean' }),
  nullable: (or) => jsonSchema((o) => ({ anyOf: [or.make(o), { type: 'null' }] })),
  type: (props) =>
    JsonSchema.of({
      type: 'object',
      properties: pipe(
        props,
        map((a: JsonSchema<Partial<JSONSchema7>, unknown>) => a.make({})),
      ),
      required: Object.keys(props),
    }),
  partial: (props) =>
    JsonSchema.of({
      type: 'object',
      properties: pipe(
        props,
        map((a: JsonSchema<Partial<JSONSchema7>, unknown>) => a.make({})),
      ),
    }),
  intersect: (right) => (left) => JsonSchema.of({ allOf: [left.make({}), right.make({})] }),
  record: (co) => JsonSchema.of({ type: 'object', additionalProperties: co.make({}) }),
  array: (item) => JsonSchema.of({ type: 'array', items: item.make({}) }),
  tuple: (...items) => JsonSchema.of({ anyOf: items.map((i) => i.make({})) }),
  sum: (() => (members) => union(...members)) as Schemable2C<URI, Partial<JSONSchema7>>['sum'],
  lazy: <A>(_: string, f: () => JsonSchema<Partial<JSONSchema7>, A>) => {
    let schema: Option<JsonSchema<Partial<JSONSchema7>, A>> = none

    return {
      make: (o) => {
        if (isSome(schema)) {
          return schema.value.make(o)
        }

        const jsonSchema = f()

        schema = some(jsonSchema)

        return jsonSchema.make(o)
      },
    }
  },
}

export const WithUnion: WithUnion2C<URI, Partial<JSONSchema7>> = {
  union,
}

export const WithRefine: WithRefine2C<URI, Partial<JSONSchema7>> = {
  // Refinements are not yet supported by json schema
  refine: (() => (from) => from) as WithRefine2C<URI, Partial<JSONSchema7>>['refine'],
}

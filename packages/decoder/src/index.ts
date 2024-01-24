/**
 * Decoder is a small extension of @effect/Schema which enables the ability to transform the
 * output values independently of encoding.
 *
 * It is important to note that this library is not intended to be used without @effect/schema,
 * and thus does not provide string/number Decoders or any other built-in Decoders. Instead,
 * you can pass Schema's directly to all functions which accept Decoders and it will be converted
 * to a Decoder, and cached, automatically.
 *
 * @since 1.0.0
 */

import { Schema } from "@effect/schema"
import type { ParseOptions } from "@effect/schema/AST"
import type { ParseError } from "@effect/schema/ParseResult"
import { Effect } from "effect"
import { dual } from "effect/Function"
import { hasProperty } from "effect/Predicate"

/**
 * @since 1.0.0
 */
export const DecoderTypeId = Symbol.for("@typed/decoder/Decoder")

/**
 * @since 1.0.0
 */
export type DecoderTypeId = typeof DecoderTypeId

/**
 * Decoder is a small extension of @effect/Schema which enables the ability to transform the
 * output values independently of encoding.
 * @since 1.0.0
 */
export interface Decoder<I, R, E, O> {
  readonly [DecoderTypeId]: DecoderTypeId
  readonly decode: (input: I, options?: ParseOptions) => Effect.Effect<R, E, O>
  readonly options?: ParseOptions | undefined
}

/**
 * @since 1.0.0
 */
export function make<I, R, E, O>(
  decode: (input: I, options?: ParseOptions) => Effect.Effect<R, E, O>,
  options?: ParseOptions
): Decoder<I, R, E, O> {
  return {
    [DecoderTypeId]: DecoderTypeId,
    decode,
    options
  } as const
}

// Avoid creating Decoders for the same Schema over and over again
const schemaDecoderCache = new WeakMap<Schema.Schema<any, any>, Decoder<any, any, ParseError, any>>()

/**
 * Lift a Schema<I, O> into a Decoder<I, never, ParseError, O>.
 * @since 1.0.0
 */
export function fromSchema<R, I, O>(schema: Schema.Schema<R, I, O>): Decoder<I, R, ParseError, O> {
  const cached = schemaDecoderCache.get(schema)
  if (cached === undefined) {
    const decoder = make(Schema.decode(schema))
    schemaDecoderCache.set(schema, decoder)
    return decoder
  } else {
    return cached
  }
}

/**
 * Transform the output of a Decoder/Schema using an Effect.
 * @since 1.0.0
 */
export const mapEffect: {
  <O, R2, E2, B>(
    f: (value: O) => Effect.Effect<R2, E2, B>
  ): {
    <I, R, E>(input: Decoder<I, R, E, O>): Decoder<I, R | R2, E | E2 | ParseError, B>
    <R, I>(input: Schema.Schema<R, I, O>): Decoder<I, R2, E2 | ParseError, B>
    <I, R, E>(input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>): Decoder<
      I,
      R | R2,
      E | E2 | ParseError,
      B
    >
  }

  <I, R, E, O, R2, E2, B>(input: Decoder<I, R, E, O>, f: (value: O) => Effect.Effect<R2, E2, B>): Decoder<
    I,
    R | R2,
    E | E2 | ParseError,
    B
  >

  <R, I, O, R2, E2, B>(
    input: Schema.Schema<R, I, O>,
    f: (value: O) => Effect.Effect<R2, E2, B>
  ): Decoder<I, R | R2, E2 | ParseError, B>

  <I, R = never, E = never, O = never, R2 = never, E2 = never, B = never>(
    input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>,
    f: (value: O) => Effect.Effect<R2, E2, B>
  ): Decoder<I, R | R2, E | E2 | ParseError, B>
} = dual(2, function parse<I, R = never, E = never, O = never, R2 = never, E2 = never, B = never>(
  input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>,
  f: (value: O) => Effect.Effect<R2, E2, B>
): Decoder<I, R | R2, E | E2 | ParseError, B> {
  const decoder = getDecoder(input)

  return make((input: I, options?: ParseOptions) =>
    Effect.flatMap(decoder.decode(input, { ...decoder.options, ...options }), f)
  )
})

/**
 * Transform the output of a Decoder/Schema using a function.
 * @since 1.0.0
 */
export const map: {
  <O, B>(f: (o: O) => B): {
    <I, R, E>(input: Decoder<I, R, E, O>): Decoder<I, R, E, B>
    <R, I>(input: Schema.Schema<R, I, O>): Decoder<I, R, ParseError, B>
    <I, R, E>(input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>): Decoder<I, R, E | ParseError, B>
  }

  <I, R, E, O, B>(input: Decoder<I, R, E, O>, f: (o: O) => B): Decoder<I, R, E, B>
  <R, I, O, B>(input: Schema.Schema<R, I, O>, f: (o: O) => B): Decoder<I, never, ParseError, B>
  <I, R, E, O, B>(input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>, f: (o: O) => B): Decoder<I, R, ParseError | E, B>
} = dual(2, function<I, R, E, O, B>(input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>, f: (o: O) => B) {
  return mapEffect(input, (o) => Effect.sync(() => f(o)))
})

/**
 * Pipe the output of a Decoder/Schema into another Decoder/Schema for transformation
 * @since 1.0.0
 */
export const compose: {
  <O, R2, E2, B>(
    to: Decoder<O, R2, E2, B>
  ): {
    <I, R, E>(from: Decoder<I, R, E, O>): Decoder<I, R | R2, E | E2, B>
    <R, I>(from: Schema.Schema<R, I, O>): Decoder<I, R2, E2 | ParseError, B>
    <I, R, E>(from: Decoder<I, R, E, O> | Schema.Schema<R, I, O>): Decoder<I, R | R2, E | E2 | ParseError, B>
  }

  <O, B>(to: Schema.Schema<O, B>): {
    <I, R, E>(from: Decoder<I, R, E, O>): Decoder<I, R, E | ParseError, B>
    <R, I>(from: Schema.Schema<R, I, O>): Decoder<I, never, ParseError, B>
    <I, R, E>(from: Decoder<I, R, E, O> | Schema.Schema<R, I, O>): Decoder<I, R, E | ParseError, B>
  }

  <O, R2, E2, B>(
    to: Decoder<O, R2, E2, B> | Schema.Schema<R2, O, B>
  ): {
    <I, R, E>(from: Decoder<I, R, E, O>): Decoder<I, R | R2, E | E2 | ParseError, B>
    <I>(from: Schema.Schema<I, O>): Decoder<I, R2, E2 | ParseError, B>
    <I, R, E>(from: Decoder<I, R, E, O> | Schema.Schema<I, O>): Decoder<I, R | R2, E | E2 | ParseError, B>
  }

  <I, R, E, O, R2, E2, B>(
    from: Decoder<I, R, E, O>,
    to: Decoder<O, R2, E2, B>
  ): Decoder<I, R | R2, E | E2, B>
  <R, I, O, R2, E2, B>(from: Schema.Schema<R, I, O>, to: Decoder<O, R2, E2, B>): Decoder<I, R | R2, E2 | ParseError, B>
  <I, R, E, R2, O, B>(from: Decoder<I, R, E, O>, to: Schema.Schema<R2, O, B>): Decoder<I, R | R2, E | ParseError, B>
  <R, I, O, R2, B>(from: Schema.Schema<R, I, O>, to: Schema.Schema<R2, O, B>): Decoder<I, R | R2, ParseError, B>
  <I, R, E, O, R2, E2, B>(
    from: Decoder<I, R, E, O> | Schema.Schema<R, I, O>,
    to: Decoder<O, R2, E2, B> | Schema.Schema<R2, O, B>
  ): Decoder<I, R | R2, ParseError | E | E2, B>
} = dual(2, function<I, R, E, O, R2, E2, B>(
  from: Decoder<I, R, E, O> | Schema.Schema<R, I, O>,
  to: Decoder<O, R2, E2, B> | Schema.Schema<R2, O, B>
) {
  return mapEffect(from, getDecoder(to).decode)
})

/**
 * Get a Decoder from a Decoder or Schema.
 *
 * @since 1.0.0
 */
export const getDecoder: {
  <I, R, E, O>(decoder: Decoder<I, R, E, O>): Decoder<I, R, E, O>
  <R, I, O>(schema: Schema.Schema<R, I, O>): Decoder<I, R, ParseError, O>
  <I, R = never, E = never, O = never>(
    decoder: Decoder<I, R, E, O> | Schema.Schema<R, I, O>
  ): Decoder<I, R, E | ParseError, O>
} = function getDecoder<I, R, E, O>(
  decoder: Decoder<I, R, E, O> | Schema.Schema<I, O>
): any {
  if (DecoderTypeId in decoder) {
    return decoder as Decoder<I, R, E, O>
  } else {
    return fromSchema(decoder)
  }
}

/**
 * Check if a value is a Decoder.
 *
 * @since 1.0.0
 */
export function isDecoder<I = unknown, R = unknown, E = unknown, O = unknown>(
  u: unknown
): u is Decoder<I, R, E, O> {
  return hasProperty(u, DecoderTypeId)
}

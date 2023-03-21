import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as AST from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'

import type { Decoder } from './decoder.js'

const numberFailure = (message: string, actual: number) =>
  ParseResult.failure(
    ParseResult.type(
      AST.setAnnotation(AST.numberKeyword, AST.MessageAnnotationId, () => message),
      actual,
    ),
  )

export const lessThan =
  (max: number) =>
  <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    pipe(
      decoder(i, options),
      Effect.flatMap((n) =>
        n < max
          ? ParseResult.success(n)
          : numberFailure(`Expected number to be less than ${max}, got ${n}`, n),
      ),
    )

export const lessThanOrEqualTo =
  (max: number) =>
  <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
    pipe(decoder, lessThan(max + 1))

export const greaterThan =
  (min: number) =>
  <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    pipe(
      decoder(i, options),
      Effect.flatMap((n) =>
        n > min
          ? ParseResult.success(n)
          : numberFailure(`Expected number to be greater than ${min}, got ${n}`, n),
      ),
    )

export const greaterThanOrEqualTo =
  (min: number) =>
  <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
    pipe(decoder, greaterThan(min - 1))

export const int =
  <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    pipe(
      decoder(i, options),
      Effect.flatMap((n) =>
        Number.isInteger(n)
          ? ParseResult.success(n)
          : numberFailure(`Expected number to be an integer, got ${n}`, n),
      ),
    )

export const nonNan =
  <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    pipe(
      decoder(i, options),
      Effect.flatMap((n) =>
        Number.isNaN(n)
          ? numberFailure(`Expected number to be a number, got NaN`, n)
          : ParseResult.success(n),
      ),
    )

export const finite =
  <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    pipe(
      decoder(i, options),
      Effect.flatMap((n) =>
        Number.isFinite(n)
          ? ParseResult.success(n)
          : numberFailure(`Expected number to be finite, got ${n}`, n),
      ),
    )

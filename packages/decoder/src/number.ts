import * as AST from "@effect/schema/AST"
import * as PR from "@effect/schema/ParseResult"
import { pipe } from "effect"

import type { Decoder } from "@typed/decoder/decoder"

const numberFailure = (message: string, actual: number) =>
  PR.failure(
    PR.type(
      AST.setAnnotation(AST.numberKeyword, AST.MessageAnnotationId, () => message),
      actual
    )
  )

export const lessThan = (max: number) => <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> => (i, options) =>
  PR.flatMap(
    decoder(i, options),
    (n) => n < max ? PR.success(n) : numberFailure(`Expected number to be less than ${max}, got ${n}`, n)
  )

export const lessThanOrEqualTo = (max: number) => <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
  pipe(decoder, lessThan(max + 1))

export const greaterThan =
  (min: number) => <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> => (i, options) =>
    PR.flatMap(
      decoder(i, options),
      (n) => n > min ? PR.success(n) : numberFailure(`Expected number to be greater than ${min}, got ${n}`, n)
    )

export const greaterThanOrEqualTo = (min: number) => <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> =>
  pipe(decoder, greaterThan(min - 1))

export const int = <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> => (i, options) =>
  PR.flatMap(
    decoder(i, options),
    (n) => Number.isInteger(n) ? PR.success(n) : numberFailure(`Expected number to be an integer, got ${n}`, n)
  )

export const nonNan = <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> => (i, options) =>
  PR.flatMap(
    decoder(i, options),
    (n) => Number.isNaN(n) ? numberFailure(`Expected number to be a number, got NaN`, n) : PR.success(n)
  )

export const finite = <I, O extends number>(decoder: Decoder<I, O>): Decoder<I, O> => (i, options) =>
  PR.flatMap(
    decoder(i, options),
    (n) => Number.isFinite(n) ? PR.success(n) : numberFailure(`Expected number to be finite, got ${n}`, n)
  )

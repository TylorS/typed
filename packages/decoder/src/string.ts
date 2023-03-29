import { pipe } from '@effect/data/Function'
import * as AST from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'

import type { Decoder } from './decoder.js'

const stringFailure = (message: string, actual: string) =>
  ParseResult.failure(
    ParseResult.type(
      AST.setAnnotation(AST.stringKeyword, AST.MessageAnnotationId, () => message),
      actual,
    ),
  )

export const minLength =
  (min: number) =>
  <I, O extends string>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    ParseResult.flatMap(decoder(i, options), (s) =>
      s.length >= min
        ? ParseResult.success(s)
        : stringFailure(`Expected string to have a minimum length of ${min}, got ${s.length}`, s),
    )

export const maxLength =
  (max: number) =>
  <I, O extends string>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    ParseResult.flatMap(decoder(i, options), (s) =>
      s.length <= max
        ? ParseResult.success(s)
        : stringFailure(`Expected string to have a maximum length of ${max}, got ${s.length}`, s),
    )

export const length =
  (length: number) =>
  <I, O extends string>(decoder: Decoder<I, O>): Decoder<I, O> =>
    pipe(decoder, minLength(length), maxLength(length))

export const nonEmpty = minLength(1)

export const startsWith =
  (prefix: string) =>
  <I, O extends string>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    ParseResult.flatMap(decoder(i, options), (s) =>
      s.startsWith(prefix)
        ? ParseResult.success(s)
        : stringFailure(`Expected string to start with ${prefix}, got ${s}`, s),
    )

export const endsWith =
  (suffix: string) =>
  <I, O extends string>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    ParseResult.flatMap(decoder(i, options), (s) =>
      s.endsWith(suffix)
        ? ParseResult.success(s)
        : stringFailure(`Expected string to end with ${suffix}, got ${s}`, s),
    )

export const includes =
  (substring: string) =>
  <I, O extends string>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    ParseResult.flatMap(decoder(i, options), (s) =>
      s.includes(substring)
        ? ParseResult.success(s)
        : stringFailure(`Expected string to include ${substring}, got ${s}`, s),
    )

export const pattern =
  (regex: RegExp) =>
  <I, O extends string>(decoder: Decoder<I, O>): Decoder<I, O> =>
  (i, options) =>
    ParseResult.flatMap(decoder(i, options), (s) =>
      regex.test(s)
        ? ParseResult.success(s)
        : stringFailure(`Expected string to match ${regex}, got ${s}`, s),
    )

export const trimmed =
  <I, O extends string>(decoder: Decoder<I, O>): Decoder<I, string> =>
  (i, options) =>
    ParseResult.map(decoder(i, options), (s) => s.trim())

// TODO: TempalteLiteral

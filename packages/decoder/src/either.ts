import type * as Either from '@effect/data/Either'
import * as Equal from '@effect/data/Equal'
import * as Hash from '@effect/data/Hash'
import * as Effect from '@effect/io/Effect'

import type { Decoder } from './decoder.js'
import { any, literal } from './primitives.js'
import { struct } from './struct.js'
import { union } from './union.js'

export const right = <A>(member: Decoder<unknown, A>): Decoder<unknown, Either.Right<A>> =>
  struct({
    _tag: literal('Right'),
    right: member,
    [Equal.symbol]: any,
    [Hash.symbol]: any,
    traced: any,
    [Effect.EffectTypeId]: any,
  })

export const left = <A>(member: Decoder<unknown, A>): Decoder<unknown, Either.Left<A>> =>
  struct({
    _tag: literal('Left'),
    left: member,
    [Equal.symbol]: any,
    [Hash.symbol]: any,
    traced: any,
    [Effect.EffectTypeId]: any,
  })

export const either = <A, B>(
  l: Decoder<unknown, A>,
  r: Decoder<unknown, B>,
): Decoder<unknown, Either.Either<A, B>> => union(left(l), right(r))

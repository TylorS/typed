import type * as Either from '@effect/data/Either'
import * as Equal from '@effect/data/Equal'
import * as Hash from '@effect/data/Hash'

import type { Decoder } from './decoder.js'
import * as prim from './primitives.js'
import { struct } from './struct.js'
import { union } from './union.js'

export const right = <A>(member: Decoder<unknown, A>): Decoder<unknown, Either.Right<A>> =>
  struct({
    _tag: prim.literal('Right'),
    right: member,
    [Equal.symbol]: prim.any,
    [Hash.symbol]: prim.any,
  })

export const left = <A>(member: Decoder<unknown, A>): Decoder<unknown, Either.Left<A>> =>
  struct({
    _tag: prim.literal('Left'),
    left: member,
    [Equal.symbol]: prim.any,
    [Hash.symbol]: prim.any,
  })

export const either = <A, B>(
  l: Decoder<unknown, A>,
  r: Decoder<unknown, B>,
): Decoder<unknown, Either.Either<A, B>> => union(left(l), right(r))

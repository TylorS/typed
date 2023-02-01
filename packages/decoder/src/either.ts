import type * as Either from '@fp-ts/core/Either'

import type { Decoder } from './decoder.js'
import { literal } from './primitives.js'
import { struct } from './struct.js'
import { union } from './union.js'

export const right = <A>(member: Decoder<unknown, A>): Decoder<unknown, Either.Right<A>> =>
  struct({
    _tag: literal('Right'),
    right: member,
  })

export const left = <A>(member: Decoder<unknown, A>): Decoder<unknown, Either.Left<A>> =>
  struct({
    _tag: literal('Left'),
    left: member,
  })

export const either = <A, B>(
  l: Decoder<unknown, A>,
  r: Decoder<unknown, B>,
): Decoder<unknown, Either.Either<A, B>> => union(left(l), right(r))

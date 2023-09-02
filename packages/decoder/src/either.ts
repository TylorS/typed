import * as Either from '@effect/data/Either'
import * as Equal from '@effect/data/Equal'
import * as Hash from '@effect/data/Hash'
import { NodeInspectSymbol } from '@effect/data/Inspectable'
import * as Effect from '@effect/io/Effect'

import type { Decoder } from './decoder.js'
import { any, literal } from './primitives.js'
import { struct } from './struct.js'
import { union } from './union.js'

export const right = <A, E = never>(
  member: Decoder<unknown, A>,
): Decoder<unknown, Either.Right<E, A>> =>
  struct({
    _tag: literal('Right'),
    right: member,
    [Equal.symbol]: any,
    [Hash.symbol]: any,
    [Effect.EffectTypeId]: any,
    [Either.TypeId]: any,
    _id: any,
    pipe: any,
    toJSON: any,
    [NodeInspectSymbol]: any,
  })

export const left = <E, A = never>(
  member: Decoder<unknown, E>,
): Decoder<unknown, Either.Left<E, A>> =>
  struct({
    _tag: literal('Left'),
    left: member,
    [Equal.symbol]: any,
    [Hash.symbol]: any,
    toJSON: any,
    [Either.TypeId]: any,
    _id: any,
    pipe: any,
    [NodeInspectSymbol]: any,
    [Effect.EffectTypeId]: any,
  })

export const either = <A, B>(
  l: Decoder<unknown, A>,
  r: Decoder<unknown, B>,
): Decoder<unknown, Either.Either<A, B>> => union(left(l), right(r))

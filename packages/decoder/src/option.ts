import * as Equal from '@effect/data/Equal'
import * as Hash from '@effect/data/Hash'
import type * as Option from '@effect/data/Option'

import type { Decoder } from './decoder.js'
import { any, literal } from './primitives.js'
import { struct } from './struct.js'
import { union } from './union.js'

export const some = <A>(member: Decoder<unknown, A>): Decoder<unknown, Option.Some<A>> =>
  struct({
    _tag: literal('Some'),
    value: member,
    [Equal.symbol]: any,
    [Hash.symbol]: any,
  })

export const none: Decoder<unknown, Option.None> = struct({
  _tag: literal('None'),
  [Equal.symbol]: any,
  [Hash.symbol]: any,
})

export const option = <A>(member: Decoder<unknown, A>): Decoder<unknown, Option.Option<A>> =>
  union(some(member), none)

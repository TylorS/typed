import type * as Option from '@fp-ts/core/Option'

import type { Decoder } from './decoder.js'
import { literal } from './primitives.js'
import { struct } from './struct.js'
import { union } from './union.js'

export const some = <A>(member: Decoder<unknown, A>): Decoder<unknown, Option.Some<A>> =>
  struct({
    _tag: literal('Some'),
    value: member,
  })

export const none: Decoder<unknown, Option.None> = struct({
  _tag: literal('None'),
})

export const option = <A>(member: Decoder<unknown, A>): Decoder<unknown, Option.Option<A>> =>
  union(some(member), none)

import type { Decoder } from './decoder.js'
import * as prim from './primitives.js'
import { union } from './union.js'

export const nullable = <A>(member: Decoder<unknown, A>): Decoder<unknown, A | null> =>
  union(member, prim.null)

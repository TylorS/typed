import type { Decoder } from './decoder.js'
import * as prim from './primitives.js'
import { union } from './union.js'

export const optional = <A>(member: Decoder<unknown, A>): Decoder<unknown, A | undefined> =>
  union(member, prim.undefined)

import { iso } from 'newtype-ts'

import { Op, UriOf } from './Op'

const isoOp = iso<Op<any, any>>()

/**
 * Create an Op instance
 */
export function createOp<O extends Op<any, any>>(key: UriOf<O>): O {
  return isoOp.wrap(key) as O
}

export function unwrapOp<O extends Op<any, any>>(op: O): UriOf<O> {
  return isoOp.unwrap(op)
}

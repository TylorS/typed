import { iso } from 'newtype-ts'

import { Op, UriOf } from './'

const isoOp = iso<Op<any, any>>()

/**
 * Create an Op instance
 */
export function createOp<O extends Op<any, any>>(key: UriOf<O>): O {
  return isoOp.wrap(key) as O
}

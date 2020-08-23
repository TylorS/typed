import { iso } from 'newtype-ts'

import { Op, UriOf } from './'

const isoOp = iso<Op>()

/**
 * Create an Op instance
 */
export function createOp<O extends Op>(key: UriOf<O>): O {
  return isoOp.wrap(key) as O
}

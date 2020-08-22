import { iso } from 'newtype-ts'

import { Op, UriOf } from './Op'

const isoOp = iso<Op>()

export function createOp<O extends Op>(key: UriOf<O>): O {
  return isoOp.wrap(key) as O
}

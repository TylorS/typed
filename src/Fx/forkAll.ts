import { fork, TupleErrors } from '@/Effect'
import { RuntimeOptions } from '@/Fiber'

import { tuple } from './Effect'
import { Fx } from './Fx'

export function forkAll<A extends ReadonlyArray<Fx<any, any, any> | Fx<any, never, any>>>(
  fxs: A,
  options?: RuntimeOptions<TupleErrors<A>>,
) {
  return tuple(fxs.map((fx) => fork(fx, options)))
}

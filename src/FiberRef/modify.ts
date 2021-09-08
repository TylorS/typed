import { fromInstruction, Fx } from '@/Fx'

import { FiberRef } from './FiberRef'
import { ModifyFiberRef } from './Instruction'

export function modify<A, R, E, B>(f: (a: A) => Fx<R, E, readonly [B, A]>) {
  return (ref: FiberRef<A>): Fx<R, E, readonly [B, A]> =>
    fromInstruction(new ModifyFiberRef(ref, f))
}

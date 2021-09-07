import { fromInstruction, Pure } from '@/Fx'

import { FiberRef } from './FiberRef'
import { ModifyFiberRef } from './Instruction'

export function modify<A, B>(f: (a: A) => readonly [B, A]) {
  return (ref: FiberRef<A>): Pure<readonly [B, A]> => fromInstruction(new ModifyFiberRef(ref, f))
}

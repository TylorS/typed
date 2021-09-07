import { fromInstruction, Pure } from '@/Fx'

import { FiberRef } from './FiberRef'
import { MakeFiberRef, MakeFiberRefOptions } from './Instruction'

export function make<A>(initial: A, options: MakeFiberRefOptions<A> = {}): Pure<FiberRef<A>> {
  return fromInstruction(new MakeFiberRef<A>(initial, options))
}

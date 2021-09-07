import { fromInstruction, Fx } from '@/Fx'

import { Fiber } from './Fiber'
import { JoinInstruction } from './Instruction'

export function join<R, E, A>(fiber: Fiber<R, E, A>): Fx<R, E, A> {
  return fromInstruction(new JoinInstruction(fiber))
}

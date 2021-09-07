import { fromInstruction, Fx } from '@/Fx'

import { Fiber } from './Fiber'
import { ForkInstruction } from './Instruction'

export function fork<R, E, A>(fx: Fx<R, E, A>): Fx<R, never, Fiber<R, E, A>> {
  return fromInstruction(new ForkInstruction(fx))
}

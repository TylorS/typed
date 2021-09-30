import { FiberInstruction } from '@/Fiber/FiberInstruction'
import type { FiberRefInstruction } from '@/FiberRef/FiberRefInstruction'

import type { OutputOfBaseFx, RequirementsOfBaseFx } from './BaseFx'
import type { Computations } from './Computations'
import type { Fx } from './Fx'

export type Instruction<R, A> =
  | Computations<R, A>
  | FiberInstruction<R, A>
  | FiberRefInstruction<R, A>

export function fromInstruction<I extends Instruction<any, any>>(
  instruction: I,
): Fx<RequirementsOfBaseFx<I>, OutputOfBaseFx<I>> {
  return {
    [Symbol.iterator]: function* () {
      const a = yield instruction

      return a as OutputOfBaseFx<I>
    },
  }
}

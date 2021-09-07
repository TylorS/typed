import { FiberInstruction } from '@/Fiber/Instruction'
import { FiberRefInstruction } from '@/FiberRef/Instruction'

import { Effects } from './Effects'
import { InterruptableStatusInstruction } from './Interrupts'

export type Instruction<R, E, A> =
  | Effects<R, E, A>
  | FiberInstruction<any, E, A>
  | FiberRefInstruction<any, A>
  | InterruptableStatusInstruction

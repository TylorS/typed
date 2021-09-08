import { FiberInstruction } from '@/Fiber/Instruction'
import { FiberRefInstruction } from '@/FiberRef/Instruction'

import { Effects } from './Effects'

export type Instruction<R, E, A> =
  | Effects<R, E, A>
  | FiberInstruction<any, E, A>
  | FiberRefInstruction<R, E, any, A>

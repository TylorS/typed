import { Fiber, RuntimeOptions } from '@/Fiber'
import { Fx } from '@/Fx'

import { instr } from './Instruction'

export class Fork<R, E, A> extends instr('Fork')<
  {
    readonly fx: Fx<R, E, A>
    readonly runtimeOptions?: RuntimeOptions
  },
  R,
  never,
  Fiber<E, A>
> {}

export const fork = <R, E, A>(fx: Fx<R, E, A>, runtimeOptions: RuntimeOptions = {}) =>
  new Fork({ fx, runtimeOptions })

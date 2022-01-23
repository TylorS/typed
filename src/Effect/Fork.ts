import { Fiber, RuntimeOptions } from '@/Fiber'
import { Fx } from '@/Fx'

import { instr } from './Instruction'

export class Fork<R, E, A> extends instr('Fork')<
  {
    readonly fx: Fx<R, E, A>
    readonly runtimeOptions?: RuntimeOptions<E>
  },
  R,
  never,
  Fiber<E, A>
> {}

export const fork = <R, E, A>(fx: Fx<R, E, A>, runtimeOptions: RuntimeOptions<E> = {}) =>
  new Fork({ fx, runtimeOptions })

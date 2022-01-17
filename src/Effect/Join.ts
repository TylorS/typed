import { Fiber } from '@/Fiber'

import { instr } from './Instruction'

export class Join<E, A> extends instr('Join')<Fiber<E, A>, unknown, E, A> {}

export const join = <E, A>(fiber: Fiber<E, A>) => new Join(fiber)

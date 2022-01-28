import { FiberContext } from '@/FiberContext'

import { instr } from './Instruction'

export class GetContext<E> extends instr('GetContext')<void, unknown, E, FiberContext<E>> {}

export const getContext = <E>(trace?: string) => new GetContext<E>(undefined, trace)

import { Context } from '@/Context'

import { instr } from './Instruction'

export class GetContext<E> extends instr('GetContext')<void, unknown, E, Context<E>> {}

export const getContext = new GetContext(undefined, 'GetContext')

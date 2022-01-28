import { LocalScope } from '@/Scope'

import { instr } from './Instruction'

export class GetScope<E, A> extends instr('GetScope')<void, unknown, E, LocalScope<E, A>> {}

export const getScope = <E>(trace?: string) => new GetScope<E, any>(undefined, trace)
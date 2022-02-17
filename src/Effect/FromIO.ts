import { Lazy } from '@/Prelude/function'

import { instr } from './Instruction'

export class FromLazy<A> extends instr('FromLazy')<Lazy<A>, unknown, never, A> {}

export const fromLazy = <A>(io: Lazy<A>, trace?: string) => new FromLazy(io, trace)

import { IO } from '@/IO'

import { instr } from './Instruction'

export class FromIO<A> extends instr('FromIO')<IO<A>, unknown, never, A> {}

export const fromIO = <A>(io: IO<A>, trace?: string) => new FromIO(io, trace)

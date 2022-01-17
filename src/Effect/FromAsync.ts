import { Async } from '@/Async'

import { instr } from './Instruction'

export class FromAsync<A> extends instr('FromAsync')<Async<A>, unknown, never, A> {}

export const fromAsync = <A>(async: Async<A>, trace?: string) => new FromAsync(async, trace)

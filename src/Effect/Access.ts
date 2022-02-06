import { flow } from '@/function'
import type { Fx } from '@/Fx'

import { of } from './FromExit'
import { instr } from './Instruction'

export class Access<R, R2, E, A> extends instr('Access')<(r: R) => Fx<R2, E, A>, R & R2, E, A> {}

export const access = <R, R2, E, A>(access: (r: R) => Fx<R2, E, A>, trace?: string) =>
  new Access(access, trace)

export const ask = <R>(trace = 'ask') => access((r: R) => of(r), trace)
export const asks = <R, A>(f: (resources: R) => A, trace = 'askk') => access(flow(f, of), trace)

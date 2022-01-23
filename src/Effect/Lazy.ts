import type { Fx } from '@/Fx'

import { instr } from './Instruction'

export class Lazy<R, E, A> extends instr('Lazy')<() => Fx<R, E, A>, R, E, A> {}

export const lazy = <R, E, A>(f: () => Fx<R, E, A>, trace?: string) => new Lazy(f, trace)

import { Effect } from './Effect'
import { instr } from './Instruction'

export class Lazy<R, E, A> extends instr('Lazy')<() => Effect<R, E, A>, R, E, A> {}

export const lazy = <R, E, A>(f: () => Effect<R, E, A>, trace?: string) => new Lazy(f, trace)

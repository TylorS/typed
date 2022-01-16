import { Exit } from '@/Exit'
import type { Fx } from '@/Fx'

import { instr } from './Instruction'

export class Result<R, E, A> extends instr('Result')<Fx<R, E, A>, R, never, Exit<E, A>> {}

export const result = <R, E, A>(effect: Fx<R, E, A>, trace?: string) => new Result(effect, trace)

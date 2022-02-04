import * as T from '@/Trace'

import { instr } from './Instruction'

export class Trace extends instr('Trace')<void, unknown, never, T.Trace> {}

export const getTrace = new Trace(undefined)

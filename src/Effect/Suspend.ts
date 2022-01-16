import { instr } from './Instruction'

export class Suspend extends instr('Suspend')<void, unknown, never, void> {}

export const suspend = (trace?: string) => new Suspend(undefined, trace)

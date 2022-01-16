import { instr } from './Instruction'

export class FromPromise<A> extends instr('FromPromise')<() => Promise<A>, unknown, never, A> {}

export const fromPromise = <A>(f: () => Promise<A>, trace?: string) => new FromPromise(f, trace)

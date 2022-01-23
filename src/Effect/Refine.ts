import { Fx } from '@/Fx'

import { instr } from './Instruction'

export class Refine<R, E, A, E2> extends instr('Refine')<
  {
    readonly fx: Fx<R, E, A>
    readonly refinement: (error: unknown) => error is E2
  },
  R,
  E | E2,
  A
> {}

export const refine =
  <E2>(refinement: (error: unknown) => error is E2, trace?: string) =>
  <R, E, A>(fx: Fx<R, E, A>): Fx<R, E | E2, A> =>
    new Refine({ fx, refinement }, trace)

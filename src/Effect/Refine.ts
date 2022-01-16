import { Effect } from './Effect'
import { instr } from './Instruction'

export class Refine<R, E, A, E2> extends instr('Refine')<
  {
    readonly effect: Effect<R, E, A>
    readonly refinement: (error: unknown) => error is E2
  },
  R,
  E | E2,
  A
> {}

export const refine =
  <E2>(refinement: (error: unknown) => error is E2, trace?: string) =>
  <R, E, A>(effect: Effect<R, E, A>): Effect<R, E | E2, A> =>
    new Refine({ effect, refinement }, trace)

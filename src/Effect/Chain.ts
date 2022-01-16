import { Effect } from './Effect'
import { instr } from './Instruction'

export class Chain<R, E, A, R2, E2, B> extends instr('Chain')<
  {
    readonly effect: Effect<R, E, A>
    readonly f: (a: A) => Effect<R2, E2, B>
  },
  R & R2,
  E | E2,
  B
> {}

export const chain =
  <A, R2, E2, B>(f: (a: A) => Effect<R2, E2, B>, trace?: string) =>
  <R, E>(effect: Effect<R, E, A>): Effect<R & R2, E | E2, B> =>
    new Chain({ effect, f }, trace)

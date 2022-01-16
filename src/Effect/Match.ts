import { Effect } from './Effect'
import { instr } from './Instruction'

export class Match<R, E, A, R2, E2, B, R3, E3, C> extends instr('Match')<
  {
    readonly effect: Effect<R, E, A>
    readonly onLeft: (e: E) => Effect<R2, E2, B>
    readonly onRight: (a: A) => Effect<R3, E3, C>
  },
  R & R2 & R3,
  E | E2 | E3,
  B | C
> {}

export const match =
  <E, R2, E2, B, A, R3, E3, C>(
    onLeft: (e: E) => Effect<R2, E2, B>,
    onRight: (a: A) => Effect<R3, E3, C>,
    trace?: string,
  ) =>
  <R>(effect: Effect<R, E, A>): Effect<R & R2 & R3, E | E2 | E3, B | C> =>
    new Match({ effect, onLeft, onRight }, trace)

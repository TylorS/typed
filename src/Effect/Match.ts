import type { Fx } from '@/Fx'

import { instr } from './Instruction'

export class Match<R, E, A, R2, E2, B, R3, E3, C> extends instr('Match')<
  {
    readonly fx: Fx<R, E, A>
    readonly onLeft: (e: E) => Fx<R2, E2, B>
    readonly onRight: (a: A) => Fx<R3, E3, C>
  },
  R & R2 & R3,
  E | E2 | E3,
  B | C
> {}

export const match =
  <E, R2, E2, B, A, R3, E3, C>(
    onLeft: (e: E) => Fx<R2, E2, B>,
    onRight: (a: A) => Fx<R3, E3, C>,
    trace?: string,
  ) =>
  <R>(fx: Fx<R, E, A>): Fx<R & R2 & R3, E | E2 | E3, B | C> =>
    new Match({ fx, onLeft, onRight }, trace)

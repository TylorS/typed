import { Fx } from '@/Fx'

import { instr } from './Instruction'

export class Chain<R, E, A, R2, E2, B> extends instr('Chain')<
  {
    readonly fx: Fx<R, E, A>
    readonly f: (a: A) => Fx<R2, E2, B>
  },
  R & R2,
  E | E2,
  B
> {}

export const chain =
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>, trace?: string) =>
  <R, E>(fx: Fx<R, E, A>): Fx<R & R2, E | E2, B> =>
    new Chain({ fx, f }, trace)

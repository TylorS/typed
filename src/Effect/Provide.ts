import type { Fx } from '@/Fx'

import { instr } from './Instruction'

export class Provide<R, E, A> extends instr('Provide')<
  { readonly fx: Fx<R, E, A>; readonly resources: R },
  unknown,
  E,
  A
> {}

export const provide =
  <R>(resources: R, trace?: string) =>
  <E, A>(fx: Fx<R, E, A>) =>
    new Provide({ fx, resources }, trace)

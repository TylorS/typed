import { Effect } from './Effect'
import { instr } from './Instruction'

export class Provide<R, E, A> extends instr('Provide')<
  { readonly effect: Effect<R, E, A>; readonly resources: R },
  unknown,
  E,
  A
> {}

export const provide =
  <R>(resources: R, trace?: string) =>
  <E, A>(effect: Effect<R, E, A>) =>
    new Provide({ effect, resources }, trace)

import { Context } from '@/Context'
import { Fx } from '@/Fx'

import { instr } from './Instruction'

export class WithinContext<R, E, A> extends instr('WithinContext')<
  { readonly fx: Fx<R, E, A>; readonly context: Context<E> },
  R,
  E,
  A
> {}

export const withinContext =
  <E>(context: Context<E>, trace?: string) =>
  <R, A>(fx: Fx<R, E, A>) =>
    new WithinContext({ context, fx }, trace)

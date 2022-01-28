import { FiberContext } from '@/FiberContext'
import { Fx } from '@/Fx'

import { instr } from './Instruction'

export class WithinContext<R, E, A> extends instr('WithinContext')<
  { readonly fx: Fx<R, E, A>; readonly context: FiberContext<E> },
  R,
  E,
  A
> {}

export const withinContext =
  <E>(context: FiberContext<E>, trace?: string) =>
  <R, A>(fx: Fx<R, E, A>) =>
    new WithinContext({ context, fx }, trace)

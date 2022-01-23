import { Fx } from '@/Fx'

import { instr } from './Instruction'

export class TracingStatus<R, E, A> extends instr('TracingStatus')<
  { readonly fx: Fx<R, E, A>; readonly tracingStatus: boolean },
  R,
  E,
  A
> {}

export const traceable = <R, E, A>(fx: Fx<R, E, A>, trace?: string) =>
  new TracingStatus({ fx, tracingStatus: true }, trace)

export const untraceable = <R, E, A>(fx: Fx<R, E, A>, trace?: string) =>
  new TracingStatus({ fx, tracingStatus: false }, trace)

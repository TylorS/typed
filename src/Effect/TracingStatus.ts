import { Effect } from './Effect'
import { instr } from './Instruction'

export class TracingStatus<R, E, A> extends instr('TracingStatus')<
  { readonly effect: Effect<R, E, A>; readonly tracingStatus: boolean },
  R,
  E,
  A
> {}

export const traceable = <R, E, A>(effect: Effect<R, E, A>, trace?: string) =>
  new TracingStatus({ effect, tracingStatus: true }, trace)

export const untraceable = <R, E, A>(effect: Effect<R, E, A>, trace?: string) =>
  new TracingStatus({ effect, tracingStatus: false }, trace)

import { OrElseInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import type { Fx } from './Fx'

export function orElse<E1, R2, E2, B>(f: (e1: E1) => Fx<R2, E2, B>) {
  return <R1, A>(fx: Fx<R1, E1, A>): Fx<R1 & R2, E2, A | B> => orElse_(fx, f)
}

function orElse_<R1, E1, A, R2, E2, B>(
  fx: Fx<R1, E1, A>,
  f: (e1: E1) => Fx<R2, E2, B>,
): Fx<R1 & R2, E2, A | B> {
  return fromInstruction(new OrElseInstruction(fx, f))
}

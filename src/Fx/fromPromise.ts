import { PromiseInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { Pure } from './Fx'

export function fromPromise<A>(effect: () => Promise<A>): Pure<A> {
  return fromInstruction(new PromiseInstruction(effect))
}

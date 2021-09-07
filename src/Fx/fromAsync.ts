import { Async } from '@/Async'

import { AsyncInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { Fx } from './Fx'

export function fromAsync<R, E, A>(async: Async<R, E, A>): Fx<R, E, A> {
  return fromInstruction(new AsyncInstruction(async))
}

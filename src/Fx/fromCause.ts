import { Cause } from '@/Cause'

import { CauseInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { EFx } from './Fx'

export function fromCause<E>(either: Cause<E>): EFx<E, never> {
  return fromInstruction(new CauseInstruction(either))
}

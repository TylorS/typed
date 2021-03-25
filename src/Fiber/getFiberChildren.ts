import { Env, GetRequirements, op } from '@typed/fp/Env'
import { Resume } from '@typed/fp/Resume'

import { Fiber } from './Fiber'

const getFiberChildren_ = op<<E, A>(fiber: Fiber<E, A>) => Resume<ReadonlySet<Fiber<E, A>>>>()(
  'getFiberChildren',
)

export type GetFiberChildren = GetRequirements<typeof getFiberChildren_>

export const getFiberChildren = <E, A>(
  fiber: Fiber<E, A>,
): Env<GetFiberChildren, ReadonlySet<Fiber<E, A>>> => getFiberChildren_((f) => f(fiber))

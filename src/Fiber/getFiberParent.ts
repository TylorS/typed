import { Env, GetRequirements, op } from '@typed/fp/Env'
import { Resume } from '@typed/fp/Resume'
import { Option } from 'fp-ts/dist/Option'

import { Fiber } from './Fiber'

const getFiberParent_ = op<<E, A>(fiber: Fiber<E, A>) => Resume<Option<Fiber<unknown, unknown>>>>()(
  'getFiberParent',
)

export type GetFiberParent = GetRequirements<typeof getFiberParent_>

export const getFiberParent = <E, A>(
  fiber: Fiber<E, A>,
): Env<GetFiberParent, Option<Fiber<unknown, unknown>>> => getFiberParent_((f) => f(fiber))

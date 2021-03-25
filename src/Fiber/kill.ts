import { GetRequirements, op } from '@typed/fp/Env'
import { Resume } from '@typed/fp/Resume'

import { Fiber } from './Fiber'

const kill_ = op<<E, A>(fiber: Fiber<E, A>) => Resume<void>>()('kill')

export const kill = <E, A>(fiber: Fiber<E, A>) => kill_((f) => f(fiber))

export type Kill = GetRequirements<typeof kill>

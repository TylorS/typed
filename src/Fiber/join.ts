import { Either } from '@typed/fp/Either'
import { GetRequirements, op } from '@typed/fp/Env'
import { Resume } from '@typed/fp/Resume'

import { Fiber } from './Fiber'

const join_ = op<<E, A>(fiber: Fiber<E, A>) => Resume<Either<E, A>>>()('join')

export const join = <E, A>(fiber: Fiber<E, A>) => join_((f) => f(fiber))

export type Join = GetRequirements<typeof join>

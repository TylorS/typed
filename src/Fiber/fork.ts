import { ask, chain, Eff, GetRequirements, op } from '@typed/fp/Eff'
import { Resume } from '@typed/fp/Resume'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'

import { Fiber } from './Fiber'

const fork_ = op<<E, A, Err = unknown>(env: Eff<E, A>, environment: E) => Resume<Fiber<Err, A>>>()(
  'fork',
)

export type Fork = GetRequirements<typeof fork_>

export const fork = <E, A, Err = unknown>(env: Eff<E, A>): Eff<WidenI<E | Fork>, Fiber<Err, A>> =>
  pipe(
    ask<E>(),
    chain((e) => fork_((f) => f(env, e))),
  )

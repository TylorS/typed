import { Effect } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'
import { Eq } from 'fp-ts/es6/Eq'

import { Channel } from '../../model'
import { GetAndUpdateState } from './GetAndUpdateState'

export const PROVIDE_CHANNEL = Symbol('@typed/fp/hooks/ProvideChannel')
export type PROVIDE_CHANNEL = typeof PROVIDE_CHANNEL

export interface ProvideChannelOp
  extends Op<
    PROVIDE_CHANNEL,
    <E1, A, E2>(
      channel: Channel<E1, A>,
      initial: Effect<E2, A>,
      eq: Eq<A>,
    ) => Effect<E1 & E2, GetAndUpdateState<A>>
  > {}

export const ProvideChannelOp = createOp<ProvideChannelOp>(PROVIDE_CHANNEL)

export const provideChannel = callOp(ProvideChannelOp)

declare module '@typed/fp/Op' {
  export interface Ops<Env> {
    [PROVIDE_CHANNEL]: {
      <E1, A, E2>(channel: Channel<E1, A>, initial: Effect<E2, A>): Effect<
        Env & E1 & E2,
        GetAndUpdateState<A>
      >
      <E1, A, E2>(channel: Channel<E1, A>, initial: Effect<E2, A>, eq: Eq<A>): Effect<
        Env & E1 & E2,
        GetAndUpdateState<A>
      >
    }
  }
}

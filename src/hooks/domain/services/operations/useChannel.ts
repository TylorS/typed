import { Arity1 } from '@typed/fp/common'
import { Effect } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'

import { Channel } from '../../model'

export const USE_CHANNEL = Symbol('@typed/fp/hooks/UseChannel')
export type USE_CHANNEL = typeof USE_CHANNEL

export interface UseChannelOp
  extends Op<
    USE_CHANNEL,
    <E, A, B = A>(channel: Channel<E, A>, selector?: Arity1<A, B>) => Effect<E, A>
  > {}

export const UseChannelOp = createOp<UseChannelOp>(USE_CHANNEL)

export const useChannel = callOp(UseChannelOp)

declare module '@typed/fp/Op' {
  export interface Ops<Env> {
    [USE_CHANNEL]: {
      <E, A>(channel: Channel<E, A>): Effect<Env & E, A>
      <E, A, B>(channel: Channel<E, A>, selector: Arity1<A, B>): Effect<Env & E, B>
    }
  }
}

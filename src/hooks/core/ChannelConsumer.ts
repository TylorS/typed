import { Arity1 } from '@typed/fp/common/types'
import { Eq } from 'fp-ts/Eq'

export interface ChannelConsumer<A, B = A> {
  readonly selector: Arity1<A, B>
  readonly eq: Eq<B>
}

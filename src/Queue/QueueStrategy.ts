import { Of } from '@/Fx'
import { NonEmptyArray } from '@/Prelude/NonEmptyArray'

import { WaitFor } from './WaitFor'

export interface QueueStrategy<A> {
  readonly capacity: number

  readonly offer: (offered: NonEmptyArray<A>, queue: A[], offers: WaitFor<A>) => Of<boolean>
}

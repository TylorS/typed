import { RefEvent } from '@fp/Ref'

import { Status } from './Status'

export type FiberEvent<A> = FiberStatusEvent<A> | FiberRefEvent<A>

export type FiberStatusEvent<A> = {
  readonly type: 'status'
  readonly status: Status<A>
}

export type FiberRefEvent<A> = {
  readonly type: 'ref'
  readonly event: RefEvent<A>
}

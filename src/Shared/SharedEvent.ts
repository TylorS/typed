import { Fiber, Status } from '@fp/Fiber'
import { RefEvent } from '@fp/Ref'

/**
 * Events for the lifecycle of Fibers using SharedReferences
 */
export type SharedEvent<A> = SharedStatus<A> | SharedRefEvent<A>

export type SharedStatus<A> = {
  readonly type: 'shared/status'
  readonly key: object
  readonly fiber: Fiber<A>
  readonly status: Status<A>
}

export type SharedRefEvent<A> = {
  readonly type: 'shared/ref'
  readonly key: object
  readonly fiber: Fiber<A>
  readonly event: RefEvent<A>
}

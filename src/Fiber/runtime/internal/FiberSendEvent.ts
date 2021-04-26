import { map, of } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { createRef, getRef, Ref } from '@fp/Ref'
import { constVoid, pipe } from 'fp-ts/function'

import { usingFiberRefs } from '../../Fiber'
import { Status } from '../../Status'

export const FIBER_SEND_EVENT = Symbol('FiberSendEvent')

export type FiberSendStatusRef<A> = Ref<unknown, (status: Status<A>) => void>

export const FiberSendStatus = <A>(sendEvent: (status: Status<A>) => void): FiberSendStatusRef<A> =>
  createRef(of(sendEvent), FIBER_SEND_EVENT, alwaysEqualsEq)

export const sendStatus = <A>(status: Status<A>) =>
  pipe(
    getRef(FiberSendStatus<A>(constVoid)),
    map((f) => f(status)),
    usingFiberRefs,
  )

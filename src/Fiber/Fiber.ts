import { Disposable, Stream } from '@most/types'
import { Either } from 'fp-ts/Either'
import { Option } from 'fp-ts/Option'

import { asks, Env } from '../Env'
import { Arity1 } from '../function'
import { Refs } from '../Ref'
import { async, Resume } from '../Resume'
import { FiberId } from './FiberId'
import { Status } from './Status'

export interface Fiber<A> extends Refs, Disposable {
  readonly id: FiberId
  readonly parent: Option<Fiber<unknown>>
  readonly status: Resume<Status<A>>
  readonly statusEvents: Stream<Status<A>>

  readonly pause: (resume: Arity1<Status<unknown>, Disposable>) => Disposable
  readonly play: Resume<Status<A>>
}

export type Fork = {
  readonly forkFiber: {
    <R, A>(env: Env<R, A>, requirements: R): Resume<Fiber<A>>
    <R, A>(env: Env<R & CurrentFiber, A>, requirements: R): Resume<Fiber<A>>
  }
}

export const fork = <R, A>(hkt: Env<R, A>): Env<Fork & R, Fiber<A>> => (e: Fork & R) =>
  e.forkFiber(hkt, e)

export type Join = {
  readonly joinFiber: <A>(fiber: Fiber<A>) => Resume<Either<Error, A>>
}

export const join = <A>(fiber: Fiber<A>): Env<Join, Either<Error, A>> => ({ joinFiber }: Join) =>
  joinFiber(fiber)

export type Kill = {
  readonly killFiber: <A>(fiber: Fiber<A>) => Resume<void>
}

export const kill = <A>(fiber: Fiber<A>): Env<Kill, void> => ({ killFiber }: Kill) =>
  killFiber(fiber)

export type CurrentFiber<A = unknown> = {
  readonly currentFiber: Fiber<A>
}

export const getCurrentFiber: Env<CurrentFiber, Fiber<unknown>> = asks(
  (e: CurrentFiber) => e.currentFiber,
)

export const getParent: Env<CurrentFiber, Option<Fiber<unknown>>> = asks(
  (e: CurrentFiber) => e.currentFiber.parent,
)

export const withFiberRefs = <E, A>(env: Env<E & Refs, A>): Env<E & CurrentFiber, A> => (e) =>
  env({ ...e, refs: e.currentFiber.refs })

export const pause: Env<CurrentFiber, Status<unknown>> = (e) =>
  async((r) => e.currentFiber.pause(r))

export const play = <A>(fiber: Fiber<A>): Env<unknown, Status<A>> => () => fiber.play

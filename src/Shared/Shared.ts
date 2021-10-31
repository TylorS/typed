import { Eq } from 'fp-ts/Eq'
import { Option } from 'fp-ts/Option'

import { Fx } from '@/Fx'
import { Stream } from '@/Stream'

export interface Shared<R, A> extends Eq<A> {
  readonly id: SharedId
  readonly initial: Fx<R, A>
  readonly namespace: Option<SharedNamespace>
}

export type SharedId = PropertyKey

export type SharedNamespace = PropertyKey

export type SharedEnv = CurrentNamespace & GetShared & SetShared & DeleteShared & SharedEvents

export interface CurrentNamespace {
  readonly currentNamespace: SharedNamespace
}

export interface GetShared {
  readonly getShared: <R, A>(shared: Shared<R, A>) => Fx<R & CurrentNamespace, A>
}

export interface SetShared {
  readonly setShared: <R, A>(shared: Shared<R, A>, value: A) => Fx<R & CurrentNamespace, A>
}

export interface DeleteShared {
  readonly deleteShared: <R, A>(shared: Shared<R, A>) => Fx<CurrentNamespace, Option<A>>
}

export interface SharedEvents {
  readonly sharedEvents: Stream<unknown, SharedEvent<unknown, any>>
}

export type SharedEvent<R, A> = SharedCreated<R, A> | SharedUpdated<R, A> | SharedDeleted<R, A>

export interface SharedCreated<R, A> {
  readonly type: 'Shared/Created'
  readonly shared: Shared<R, A>
  readonly value: A
}

export interface SharedUpdated<R, A> {
  readonly type: 'Shared/Updated'
  readonly shared: Shared<R, A>
  readonly previous: A
  readonly value: A
}

export interface SharedDeleted<R, A> {
  readonly type: 'Shared/Deleted'
  readonly shared: Shared<R, A>
  readonly value: A
}

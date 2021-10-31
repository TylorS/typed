import { Dep } from './Dep'

export type DepEvent<A> = DepCreated<A> | DepUpdated<A> | DepDeleted<A>

export interface DepCreated<A> {
  readonly type: 'Dep/Created'
  readonly dep: Dep<A>
  readonly service: A
}

export interface DepUpdated<A> {
  readonly type: 'Dep/Updated'
  readonly dep: Dep<A>
  readonly previous: A
  readonly service: A
}

export interface DepDeleted<A> {
  readonly type: 'Dep/Deleted'
  readonly dep: Dep<A>
  readonly service: A
}

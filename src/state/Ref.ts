import { Shared } from './Shared'

export interface Ref<A> {
  current: A
}

export type SharedRef<K extends string, A> = Shared<K, Ref<A>>

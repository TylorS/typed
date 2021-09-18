import { Eq } from '@/Eq'

export interface Hash<A> extends Eq<A> {
  readonly hash: (a: A) => string
}

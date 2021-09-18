import { Identity } from '@/Identity'

export interface Inverse<A> extends Identity<A> {
  readonly inverse: (left: A, right: A) => A
}

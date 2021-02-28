import { Ref } from './Ref'

export function createRef<A>(): Ref<A | undefined>
export function createRef<A>(value: A): Ref<A>

export function createRef<A>(initial?: A): Ref<A | undefined> {
  return {
    current: initial,
  }
}

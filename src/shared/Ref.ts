export interface Ref<A> {
  current: A
}

export function createRef<A>(): Ref<A | undefined>
export function createRef<A>(value: A): Ref<A>

export function createRef<A>(value?: A): Ref<A | undefined> {
  return { current: value }
}

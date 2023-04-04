export interface Mutable<A> {
  readonly get: () => A
  readonly set: (a: A) => A
}

export function Mutable<A>(initial: A) {
  let value = initial
  return {
    get: () => value,
    set: (a: A) => {
      return (value = a)
    },
  }
}

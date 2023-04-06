export interface Mutable<A> {
  readonly get: () => A
  readonly set: (a: A) => A
}

export function Mutable<A>(value: A): Mutable<A> {
  return {
    get: () => value,
    set: (a: A) => (value = a),
  }
}

export interface MutableRef<A> {
  readonly get: () => A
  readonly set: (a: A) => A
}

export const make = <A>(value: A): MutableRef<A> => ({
  get: () => value,
  set: (a) => (value = a),
})

export function get<A>(ref: MutableRef<A>): A {
  return ref.get()
}

export function set<A>(value: A) {
  return (ref: MutableRef<A>): A => {
    return ref.set(value)
  }
}

export function update<A>(f: (a: A) => A) {
  return (ref: MutableRef<A>): A => {
    return ref.set(f(ref.get()))
  }
}

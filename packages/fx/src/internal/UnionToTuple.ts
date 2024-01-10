type Contra<T> = T extends any ? (arg: T) => void
  : never

type InferContra<T> = [T] extends [(arg: infer I) => void] ? I
  : never

type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>

export type UnionToTuple<T> = PickOne<T> extends infer U ? Exclude<T, U> extends never ? [T]
  : [...UnionToTuple<Exclude<T, U>>, U]
  : never

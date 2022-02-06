export interface Left<A> {
  readonly type: 'Left'
  readonly value: A
}

export const Left = <A>(value: A): Left<A> => ({
  type: 'Left',
  value,
})

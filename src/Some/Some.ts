export interface Some<A> {
  readonly type: 'Some'
  readonly value: A
}

export const Some = <A>(value: A): Some<A> => ({
  type: 'Some',
  value,
})

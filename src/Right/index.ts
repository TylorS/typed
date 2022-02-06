export interface Right<A> {
  readonly type: 'Right'
  readonly value: A
}

export const Right = <A>(value: A): Right<A> => ({
  type: 'Right',
  value,
})

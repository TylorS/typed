export interface Both<E, A> {
  readonly type: 'Both'
  readonly left: E
  readonly right: A
}

export const Both = <E, A>(left: E, right: A): Both<E, A> => ({
  type: 'Both',
  left,
  right,
})

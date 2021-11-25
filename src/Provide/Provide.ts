export interface Provide<R> {
  readonly type: 'Provide'
  readonly requirements: R
}

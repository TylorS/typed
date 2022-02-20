export interface Reader<R, A> {
  (resources: R): A
}

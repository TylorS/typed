export interface Lazy<A> {
  (..._args: readonly any[]): A
}

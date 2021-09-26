export function isPromiseLike(x: unknown): x is PromiseLike<unknown> {
  return typeof x === 'object' && typeof (x as PromiseLike<unknown>)?.then === 'function'
}

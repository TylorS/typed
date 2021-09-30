export function isPromiseLike(x: unknown): x is PromiseLike<any> {
  return typeof x === 'object' && typeof (x as PromiseLike<any>)?.then === 'function'
}

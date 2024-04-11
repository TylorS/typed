export function disposable(f: () => void): Disposable {
  return {
    [Symbol.dispose]: f
  }
}

export const never = disposable(Function.prototype as any)

export function asyncDisposable(f: () => PromiseLike<void>): AsyncDisposable {
  return {
    [Symbol.asyncDispose]: f
  }
}

/**
 * @internal
 */
export class NonEmptyMutableStack<A> {
  protected stack: A[]
  protected index = 0

  constructor(readonly initial: A) {
    this.stack = [initial]
  }

  get current(): A {
    return this.stack[this.index]
  }

  push(value: A) {
    this.stack.push(value)
    this.index++
  }

  pop() {
    if (this.index > 0) {
      this.index--
      return this.stack.pop()
    }

    return this.initial
  }
}

export function flow2<A, B, C>(f: (a: A) => B, g: (a: B) => C): (a: A) => C {
  return (a) => g(f(a))
}

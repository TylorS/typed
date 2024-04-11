import { type Pipeable, pipeArguments } from "../Pipeable.js"

export class OfGenerator<A> implements Generator<never, A, any>, Pipeable {
  constructor(private readonly i0: A) {}
  next(): IteratorResult<never, A> {
    return { done: true, value: this.i0 }
  }
  throw(e: any): IteratorResult<never, A> {
    throw e
  }
  return(value: A): IteratorResult<never, A> {
    return { done: true, value }
  }
  [Symbol.iterator](): Generator<never, A, any> {
    return this
  }
  pipe() {
    return pipeArguments(this, arguments)
  }
}

export class SingleShotGenerator<R, A> implements Generator<R, A> {
  private done = false
  constructor(readonly i0: R) {}

  next(...[value]: [A] | []): IteratorResult<R, A> {
    if (this.done) {
      return { done: true, value: value as A }
    }
    this.done = true
    return { done: false, value: this.i0 }
  }

  throw(e: any): IteratorResult<R, A> {
    throw e
  }

  return(value: A): IteratorResult<R, A> {
    return this.next(value)
  }

  [Symbol.iterator](): Generator<R, A> {
    return this
  }
}

export class MapGenerator<R, A, B> implements Generator<R, B> {
  constructor(private readonly i0: Iterator<R, A, unknown>, private readonly i1: (a: A) => B) {}

  next(...args: [] | [unknown]): IteratorResult<R, B> {
    const n = this.i0.next(...args)
    if (n.done) {
      return { done: true, value: this.i1(n.value as A) }
    }
    return { done: false, value: n.value }
  }

  throw(e: any): IteratorResult<R, B> {
    const result = this.i0.throw?.(e)
    if (result === undefined) {
      throw e
    }

    if (result.done) {
      return { done: true, value: this.i1(result.value as A) }
    }

    return result
  }

  return(value: B): IteratorResult<R, B> {
    return { done: true, value }
  }

  [Symbol.iterator](): Generator<R, B> {
    return this
  }
}

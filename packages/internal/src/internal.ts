export class SingleShotGen<T, A> implements Generator<T, A, A> {
  called = false

  constructor(readonly value: T) {}

  next(a: A): IteratorResult<T, A> {
    if (this.called) {
      return done(a)
    }

    this.called = true

    return cont(this.value)
  }

  return(a: A): IteratorResult<T, A> {
    return done(a)
  }

  throw(e: unknown): IteratorResult<T, A> {
    throw e
  }

  [Symbol.iterator](): Generator<T, A, A> {
    return new SingleShotGen<T, A>(this.value)
  }
}

function cont<T, A>(value: T): IteratorResult<T, A> {
  return {
    done: false,
    value,
  }
}

function done<T, A>(value: A): IteratorResult<T, A> {
  return {
    done: true,
    value,
  }
}

export class RingBuffer<T> implements Iterable<T> {
  protected readonly buffer: T[] = []

  constructor(readonly maxSize: number) {}

  push(value: T): void {
    if (this.buffer.length === this.maxSize) {
      this.buffer.shift()
    }

    this.buffer.push(value)
  }

  [Symbol.iterator](): Iterator<T> {
    return this.buffer[Symbol.iterator]()
  }
}

export class NonEmptyStack<T> implements Iterable<T> {
  readonly stack: [T, ...T[]] = [this.initial]

  constructor(readonly initial: T) {}

  get current(): T {
    return this.stack[0]
  }

  push(value: T): T {
    this.stack.unshift(value)
    return value
  }

  pop(): T {
    if (this.stack.length > 1) {
      return this.stack.shift() as T
    }

    return this.initial
  }

  [Symbol.iterator](): Iterator<T> {
    return this.stack[Symbol.iterator]()
  }
}

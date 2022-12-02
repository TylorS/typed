import { Equal, hash, hashCombine, symbolEqual, symbolHash } from '@fp-ts/data/Equal'

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

export class OfGen<A> implements Generator<never, A, A> {
  constructor(readonly value: A) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next(_: A): IteratorResult<never, A> {
    return done(this.value)
  }

  return(a: A): IteratorResult<never, A> {
    return done(a)
  }

  throw(e: unknown): IteratorResult<never, A> {
    throw e
  }

  [Symbol.iterator](): Generator<never, A, A> {
    return this
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

export function hashAll(...args: unknown[]): number {
  return args.reduce((acc: number, arg) => hashCombine(hash(arg))(acc), 0)
}

export function memoHash(f: () => number): Equal {
  let memoized: number | undefined

  const getHash = () => {
    if (memoized === undefined) {
      memoized = f()
    }

    return memoized
  }

  const eq: Equal = {
    [symbolHash]: getHash,
    [symbolEqual]: (that) => hash(that) === getHash(),
  }

  return eq
}

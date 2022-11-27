export class SingleShotGen<T, A> implements Generator<T, A, A> {
  called = false

  constructor(readonly value: T) {}

  next(a: A): IteratorResult<T, A> {
    return this.called ? done(a) : ((this.called = true), cont(this.value))
  }

  return(a: A): IteratorResult<T, A> {
    return done(a)
  }

  throw(e: unknown): IteratorResult<T, A> {
    throw e
  }

  [Symbol.iterator](): Generator<T, A> {
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

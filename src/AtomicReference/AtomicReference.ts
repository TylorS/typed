export class AtomicReference<A> {
  #current: A

  constructor(readonly initial: A) {
    this.#current = initial
  }

  get get(): A {
    return this.#current
  }

  set(value: A): void {
    this.#current = value
  }
}

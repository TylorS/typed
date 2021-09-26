import { Cancelable, Uncancelable } from './Cancelable'
import { cancelAll } from './cancelAll'

export class Settable implements Cancelable {
  #canceled = false
  #queue: Set<Cancelable> = new Set()

  readonly isCanceled = (): boolean => this.#canceled

  readonly add = (cancelable: Cancelable): Cancelable => {
    if (cancelable === Uncancelable) {
      return Uncancelable
    }

    if (this.isCanceled()) {
      const x = cancelable.cancel()

      if (typeof x === 'object' && typeof x.then === 'function') {
        throw new Error(`Unable to add Asynchronous Cancelable after cancelation.`)
      }
    }

    this.#queue.add(cancelable)

    return {
      cancel: () => {
        this.#queue.delete(cancelable)
      },
    }
  }

  readonly cancel = (): void | Promise<void> => {
    this.#canceled = true

    const x = cancelAll(...Array.from(this.#queue)).cancel()

    this.#queue.clear()

    return x
  }
}

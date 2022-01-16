import { constVoid } from 'fp-ts/function'

export interface Disposable {
  readonly dispose: readonly ['Sync', () => any] | readonly ['Async', () => Promise<any>]
}

export interface SyncDisposable {
  readonly dispose: readonly ['Sync', () => any]
}

export interface AsyncDisposable {
  readonly dispose: readonly ['Async', () => Promise<any>]
}

export const sync = (dispose: () => any): SyncDisposable => ({
  dispose: ['Sync', dispose],
})

export const async = (dispose: () => Promise<any>): AsyncDisposable => ({
  dispose: ['Async', dispose],
})

export const none: Disposable = sync(constVoid)

export function dispose(d: SyncDisposable): any
export function dispose(d: AsyncDisposable): Promise<any>
export function dispose(d: Disposable): any | Promise<any>
export function dispose(d: Disposable): any | Promise<any> {
  return d.dispose[1]()
}

export const checkIsAsync = (d: Disposable): d is AsyncDisposable => d.dispose[0] === 'Async'
export const checkIsSync = (d: Disposable): d is SyncDisposable => d.dispose[0] === 'Sync'

export function disposeAll(disposables: ReadonlyArray<Disposable>): Disposable {
  return disposables.some(checkIsAsync) ? disposeAllAsync(disposables) : disposeAllSync(disposables)
}

function disposeAllAsync(disposables: ReadonlyArray<Disposable>): Disposable {
  return async(async () => {
    await Promise.all(disposables.map(dispose))
  })
}

function disposeAllSync(disposables: ReadonlyArray<Disposable>): Disposable {
  return sync(() => disposables.forEach(dispose))
}

export class DisposableQueue implements Disposable {
  #numberOfAsync = 0
  #queue: Set<Disposable> = new Set()
  #isDisposed = false

  isDisposed = () => this.#isDisposed

  get #isAsync() {
    return this.#numberOfAsync > 0
  }

  get dispose() {
    return [this.#isAsync ? 'Async' : 'Sync', this.#dispose] as Disposable['dispose']
  }

  #dispose = () => {
    if (this.#isDisposed) {
      return this.#isAsync ? Promise.resolve() : void 0
    }

    this.#isDisposed = true

    if (this.#queue.size === 0) {
      return this.#isAsync ? Promise.resolve() : void 0
    }

    const items = Array.from(this.#queue.values())
    this.#queue.clear()

    return dispose(disposeAll(items))
  }

  add = (d: Disposable): Disposable => {
    if (this.#isDisposed) {
      return none
    }

    const incrementAmount = checkIsAsync(d) ? 1 : 0
    this.#queue.add(d)
    this.#numberOfAsync += incrementAmount

    return sync(() => {
      this.#queue.delete(d)
      this.#numberOfAsync -= incrementAmount
    })
  }
}

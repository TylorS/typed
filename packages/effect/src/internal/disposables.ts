import { withResolvers } from "./withResolvers.js"

export class DisposableSet implements AsyncDisposable {
  private disposables: Array<Disposable | AsyncDisposable> = []
  protected exit = withResolvers<void>()

  public isDisposed = false

  constructor(readonly interruptible: boolean) {}

  add(disposable: Disposable | AsyncDisposable): Disposable {
    // Ensure we traverse in reverse order
    this.disposables.unshift(disposable)

    return { [Symbol.dispose]: () => this.remove(disposable) }
  }

  remove(disposable: Disposable | AsyncDisposable) {
    this.disposables.splice(this.disposables.indexOf(disposable), 1)
  }

  async [Symbol.asyncDispose]() {
    // If we attempt to interrupt a non-interruptible scope, we must wait for it to complete
    if (this.interruptible === false && !this.isDisposed) {
      await this.exit.promise
    }

    if (this.isDisposed) {
      return
    }

    this.isDisposed = true

    for (const disposable of this.disposables) {
      if (isSyncDisposable(disposable)) {
        syncDispose(disposable)
      } else {
        await asyncDispose(disposable)
      }
    }
  }

  hasCompleted() {
    this.exit.resolve()
  }

  extend(interruptible: boolean = this.interruptible) {
    const child = new DisposableSet(interruptible)

    child.add(this.add(child))

    return child
  }
}

export function syncDispose(disposable: Disposable) {
  disposable[Symbol.dispose]()
}

export function asyncDispose(disposable: AsyncDisposable) {
  return disposable[Symbol.asyncDispose]()
}

export function isSyncDisposable(disposable: Disposable | AsyncDisposable): disposable is Disposable {
  return Object.hasOwn(disposable, Symbol.dispose)
}

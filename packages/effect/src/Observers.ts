import { Exit } from './Exit.js'

export class Observers<E, A> {
  private observers = new Set<(exit: Exit<E, A>) => void>()

  add(observer: (exit: Exit<E, A>) => void) {
    this.observers.add(observer)

    return () => {
      this.observers.delete(observer)
    }
  }

  notify(exit: Exit<E, A>) {
    if (this.observers.size === 0) return false

    this.observers.forEach((observer) => observer(exit))
    this.observers.clear()

    return true
  }
}

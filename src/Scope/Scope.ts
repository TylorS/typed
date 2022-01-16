/* eslint-disable @typescript-eslint/no-this-alias */
import * as Either from 'fp-ts/Either'
import { isNone, none, Option, some } from 'fp-ts/Option'

import { Branded } from '@/Branded'
import { tuple } from '@/Effect/FromTuple'
import { result } from '@/Effect/Result'
import * as Exit from '@/Exit'
import { Fx, Of } from '@/Fx'
import { decrement, increment, MutableRef } from '@/MutableRef'

export type Scope<E, A> = LocalScope<E, A> | GlobalScope

export type Finalizer = (exit: Exit.Exit<any, any>) => Of<any>

export type FinalizerKey = Branded<symbol, 'FinalizerKey'>
export const FinalizerKey = Branded<FinalizerKey>()

export class LocalScope<E, A> {
  readonly type = 'LocalScope'
  readonly exit = MutableRef.make<Option<Exit.Exit<E, A>>>(none)
  readonly refCount: RefCount = new RefCount()

  private finalizers = new Map<FinalizerKey, Finalizer>()
  private isReleased = false

  get open() {
    return isNone(this.exit.get())
  }

  get released() {
    return this.isReleased
  }

  readonly ensure = (finalizer: Finalizer): Option<FinalizerKey> => {
    if (this.released) {
      return none
    }

    const key = FinalizerKey(Symbol())

    this.finalizers.set(key, finalizer)

    return some(key)
  }

  readonly cancel = (key: FinalizerKey): boolean => {
    if (this.released) {
      return false
    }

    return this.finalizers.delete(key)
  }

  readonly extend = <E2, B>(scope: Scope<E2, B>) => {
    if (scope === this || scope.type === 'GlobalScope') {
      return true
    }
  }

  readonly close = (exit: Exit.Exit<E, A>): Of<boolean> => {
    const that = this

    return Fx(function* () {
      if (isNone(that.exit.get())) {
        that.exit.set(some(exit))
      }

      return yield* that.release()
    })
  }

  readonly release = () => {
    const that = this

    // eslint-disable-next-line require-yield
    return Fx(function* () {
      const optionExit = that.exit.get()

      if (that.refCount.decrement() > 0 || isNone(optionExit) || that.finalizers.size === 0) {
        return false
      }

      const currentExit = optionExit.value
      const fxs = Array.from(that.finalizers.values()).map((f) => result(f(currentExit)))
      const finalizerExits = yield* tuple(fxs)
      const finalizerExit = finalizerExits.reduce(Exit.then)

      if (Either.isLeft(finalizerExit)) {
        const finalExit: Exit.Exit<E, A> = Either.isLeft(currentExit)
          ? Exit.then(currentExit, finalizerExit)
          : finalizerExit

        that.exit.set(some(finalExit))
      }

      return true
    })
  }
}

export class GlobalScope {
  readonly type = 'GlobalScope'
  readonly open = true
  readonly released = false

  readonly extend = <E2, B>(scope: Scope<E2, B>) =>
    scope.type === 'GlobalScope' ? true : scope.open ? (scope.refCount.increment(), true) : false

  readonly ensure = (_finalizer: Finalizer): Option<FinalizerKey> => none
  readonly cancel = (_key: FinalizerKey) => false
  readonly close = <E, A>(_exit: Exit.Exit<E, A>) => this.release
  // eslint-disable-next-line require-yield
  readonly release = Fx(function* () {
    return false
  })
}

class RefCount {
  private count = MutableRef.make(0)

  readonly get = () => this.count
  readonly increment = () => increment(this.count)
  readonly decrement = () => decrement(this.count)
}

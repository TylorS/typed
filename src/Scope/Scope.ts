/* eslint-disable @typescript-eslint/no-this-alias */
import { Branded } from '@/Branded'
import { fromIO } from '@/Effect'
import * as Exit from '@/Exit'
import { of } from '@/Fx/Effect'
import { Fx, Of } from '@/Fx/Fx'
import { decrement, increment, MutableRef } from '@/MutableRef'
import { isNone, isSome, None, Option, Some } from '@/Option'

import { InterruptableStatus } from './InterruptableStatus'

export type Scope<E, A> = LocalScope<E, A> | GlobalScope

export type Finalizer<R = unknown, E = never> = (exit: Exit.Exit<any, any>) => Fx<R, E, any>

export type FinalizerKey = Branded<symbol, 'FinalizerKey'>
export const FinalizerKey = Branded<FinalizerKey>()

export class LocalScope<E, A> {
  readonly type = 'LocalScope'
  readonly exit = MutableRef.make<Option<Exit.Exit<E, A>>>(None)
  readonly refCount: RefCount = new RefCount()
  readonly interruptableStatus: InterruptableStatus = new InterruptableStatus()

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
      return None
    }

    const key = FinalizerKey(Symbol())

    this.finalizers.set(key, finalizer)

    return Some(key)
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

    if (!this.released && !scope.released) {
      scope.refCount.increment()

      const key = this.ensure(scope.release)

      scope.ensure(() =>
        fromIO(() => {
          if (isSome(key)) {
            this.cancel(key.value)
          }
        }),
      )

      return true
    }

    return false
  }

  readonly close = (exit: Exit.Exit<E, A>): Of<boolean> => {
    const that = this

    return Fx(function* () {
      if (isNone(that.exit.get())) {
        that.exit.set(Some(exit))
      }

      return yield* that.release()
    })
  }

  readonly release = () => {
    const that = this

    return Fx(function* () {
      const optionExit = that.exit.get()

      if (that.refCount.decrement() > 0 || isNone(optionExit)) {
        return false
      }

      if (that.finalizers.size > 0) {
        const currentExit = optionExit.value
        const finalizers = Array.from(that.finalizers.values())

        for (const finalizer of finalizers) {
          yield* finalizer(currentExit)
        }
      }

      return (that.isReleased = true)
    })
  }
}

export class GlobalScope {
  readonly type = 'GlobalScope'
  readonly open = true
  readonly released = false
  readonly extend = <E2, B>(scope: Scope<E2, B>) =>
    scope.type === 'GlobalScope' ? true : scope.open ? (scope.refCount.increment(), true) : false
  readonly ensure = (_finalizer: Finalizer): Option<FinalizerKey> => None
  readonly cancel = (_key: FinalizerKey) => false
  readonly close = <E, A>(_exit: Exit.Exit<E, A>) => this.release
  readonly release = of(false)
}

// Since GlobalScope is entirely stateless, we only need one instance
export const globalScope = new GlobalScope()

export class RefCount {
  private count = MutableRef.make(0)

  readonly get = () => this.count.get()
  readonly increment = () => increment(this.count)
  readonly decrement = () => decrement(this.count)
}

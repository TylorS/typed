/* eslint-disable @typescript-eslint/no-this-alias */
import * as Exit from '@/Exit'
import { fromLazy, of } from '@/Fx/Effect'
import { Fx, Of } from '@/Fx/Fx'
import { map } from '@/Fx/map'
import { pipe } from '@/Prelude/function'
import { decrement, increment, MutableRef } from '@/Prelude/MutableRef'
import * as O from '@/Prelude/Option'

import { Finalizer, FinalizerKey } from './Finalizer'
import { InterruptableStatus } from './InterruptableStatus'
import { ReleaseMap } from './ReleaseMap'
import type { Scope } from './Scope'

export class LocalScope<E, A> {
  readonly type = 'LocalScope'
  readonly exit = MutableRef.make<O.Option<Exit.Exit<E, A>>>(O.None)
  readonly refCount: RefCount = new RefCount()
  readonly interruptableStatus: InterruptableStatus = new InterruptableStatus()
  readonly releaseMap: ReleaseMap = new ReleaseMap()

  protected isReleased = false

  constructor(readonly parent: O.Option<Scope<any, any>> = O.None) {}

  get open() {
    return O.isNone(this.exit.get())
  }

  get released() {
    return this.isReleased
  }

  readonly ensure = <R>(finalizer: Finalizer<R>): Fx<R, never, O.Option<FinalizerKey>> => {
    if (this.released) {
      return of(O.None)
    }

    return pipe(this.releaseMap.add(finalizer), map(O.Some))
  }

  readonly cancel = (key: FinalizerKey): O.Option<Finalizer> => {
    if (this.released) {
      return O.None
    }

    return this.releaseMap.remove(key)
  }

  readonly extend = <E2, B>(scope: Scope<E2, B>) => {
    const that = this

    return Fx(function* () {
      if (scope === that || scope.type === 'GlobalScope') {
        return true
      }

      if (!that.released && !scope.released) {
        scope.refCount.increment()

        const key = yield* that.ensure(scope.release)

        yield* scope.ensure(() =>
          fromLazy(() => {
            if (O.isSome(key)) {
              that.cancel(key.value)
            }
          }),
        )

        return true
      }

      return false
    })
  }

  readonly close = (exit: Exit.Exit<E, A>): Of<boolean> => {
    const that = this

    return Fx(function* () {
      if (O.isNone(that.exit.get())) {
        that.exit.set(O.Some(exit))
      }

      return yield* that.release()
    })
  }

  readonly release = (): Of<boolean> => {
    const that = this

    return Fx(function* () {
      const optionExit = that.exit.get()

      if (that.refCount.decrement() > 0 || O.isNone(optionExit)) {
        return false
      }

      yield* that.releaseMap.releaseAll(optionExit.value)

      return (that.isReleased = true)
    })
  }
}

export class RefCount {
  private count = MutableRef.make(0)

  readonly get = () => this.count.get()
  readonly increment = () => increment(this.count)
  readonly decrement = () => decrement(this.count)
}

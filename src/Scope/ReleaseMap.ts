/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ask, chain, fromLazy } from '@/Effect'
import { Exit } from '@/Exit'
import { provideAll } from '@/Fx/Effect'
import { Fx, Of } from '@/Fx/Fx'
import { pipe } from '@/Prelude/function'
import { fromNullable, None, Option, Some } from '@/Prelude/Option'
import { Finalizer } from '@/Scope'

import { FinalizerKey } from './Finalizer'

/**
 * ReleaseMap is an underlying class utilizing in the implementation of Managed. It allows
 * tracking multiple Finalizers and closing them.
 */
export class ReleaseMap {
  private finalizers: Map<FinalizerKey, Finalizer<any, any> | Finalizer<any, never>> = new Map()

  readonly isEmpty = () => this.finalizers.size === 0

  readonly add = <R, E>(finalizer: Finalizer<R, E>): Fx<R, E, FinalizerKey> => {
    const that = this

    return Fx(function* () {
      const r = yield* ask<R>()
      const id = FinalizerKey(Symbol())

      that.finalizers.set(id, (exit) => pipe(exit, finalizer, provideAll(r)))

      return id
    })
  }

  readonly get = (key: FinalizerKey): Option<Finalizer> => {
    if (this.finalizers.has(key)) {
      return fromNullable(this.finalizers.get(key) as Finalizer)
    }

    return None
  }

  readonly release = (key: FinalizerKey, exit: Exit<any, any>): Of<Option<any>> =>
    pipe(
      fromLazy(() => this.finalizers),
      chain((map) =>
        Fx(function* () {
          if (map.has(key)) {
            const finalizer = map.get(key)!

            map.delete(key)

            return Some(yield* (finalizer as Finalizer)(exit))
          }

          return None
        }),
      ),
    )

  readonly releaseAll = (exit: Exit<any, any>): Of<void> => {
    const that = this

    return Fx(function* () {
      for (const finalizer of that.finalizers.values()) {
        yield* (finalizer as Finalizer)(exit)
      }
    })
  }

  readonly remove = (key: FinalizerKey): Option<Finalizer> => {
    if (!this.finalizers.has(key)) {
      return None
    }

    const finalizer = this.finalizers.get(key)!

    this.finalizers.delete(key)

    return Some(finalizer as Finalizer)
  }
}

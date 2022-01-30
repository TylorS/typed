/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { pipe } from 'fp-ts/function'
import { fromNullable, none, Option, some } from 'fp-ts/Option'

import { Exit } from '@/Exit'
import * as Fx from '@/Fx'
import { Finalizer } from '@/Scope'

/**
 * ReleaseMap is an underlying class utilizing in the implementation of Managed. It allows
 * tracking multiple Finalizers and closing them.
 */
export class ReleaseMap {
  readonly finalizers: Map<symbol, Finalizer<any, any> | Finalizer<any, never>> = new Map()

  readonly add = <R, E>(finalizer: Finalizer<R, E>): Fx.Fx<R, E, symbol> => {
    const that = this

    return Fx.Fx(function* () {
      const r = yield* Fx.ask<R>()
      const id = Symbol()

      that.finalizers.set(id, (exit) => pipe(exit, finalizer, Fx.provideAll(r)))

      return id
    })
  }

  readonly get = (key: symbol): Option<Finalizer> => {
    if (this.finalizers.has(key)) {
      return fromNullable(this.finalizers.get(key) as Finalizer)
    }

    return none
  }

  readonly release = (key: symbol, exit: Exit<any, any>): Fx.Of<Option<any>> =>
    pipe(
      Fx.fromIO(() => this.finalizers),
      Fx.chain((map) =>
        Fx.Fx(function* () {
          if (map.has(key)) {
            const finalizer = map.get(key)!

            map.delete(key)

            return some(yield* (finalizer as Finalizer)(exit))
          }

          return none
        }),
      ),
    )

  readonly remove = (key: symbol): Option<Finalizer> => {
    if (!this.finalizers.has(key)) {
      return none
    }

    const finalizer = this.finalizers.get(key)!

    this.finalizers.delete(key)

    return some(finalizer as Finalizer)
  }
}

import { settable } from '@fp/Disposable'
import * as E from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import * as Ref from '@fp/Ref'
import { Disposable } from '@most/types'

export const RefDisposable = Ref.create(E.fromIO(settable), Symbol('RefDisposable'))

export const add = (disposable: Disposable) =>
  Do(function* (_) {
    const settable = yield* _(RefDisposable.get)

    return settable.addDisposable(disposable)
  })

export const dispose = Do(function* (_) {
  const settable = yield* _(RefDisposable.get)

  settable.dispose()
})

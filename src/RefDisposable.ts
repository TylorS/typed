import { settable } from '@fp/Disposable'
import * as E from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Ref'
import { Disposable } from '@most/types'

const RefDisposable = R.create(E.fromIO(settable), Symbol('RefDisposable'))

export const { get, has, set, update, remove, id, initial, equals } = RefDisposable

export const add = (disposable: Disposable) =>
  Do(function* (_) {
    const settable = yield* _(RefDisposable.get)

    return settable.addDisposable(disposable)
  })

export const dispose = Do(function* (_) {
  const settable = yield* _(RefDisposable.get)

  settable.dispose()
})

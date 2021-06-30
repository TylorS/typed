import { settable } from '@fp/Disposable'
import * as E from '@fp/Env'
import * as R from '@fp/Ref'
import { Disposable } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

const RefDisposable = R.create(E.fromIO(settable), {
  eq: EqStrict,
  id: Symbol('RefDisposable'),
})

export const { get, has, set, update, remove, id, initial, equals } = RefDisposable

export const add = (disposable: Disposable) =>
  pipe(
    RefDisposable.get,
    E.map((s) => s.addDisposable(disposable)),
  )

export const dispose = pipe(
  RefDisposable.get,
  E.map((s) => s.dispose()),
)

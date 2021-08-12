import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'

import * as E from './Env'
import * as KVD from './KVDisposable'
import * as Ref2 from './Ref'

export const RefDisposable = Ref2.fromKV(KVD.KVDisposable)

export const { get } = RefDisposable

export const add = (disposable: Disposable) =>
  pipe(
    RefDisposable.get,
    E.map((s) => s.addDisposable(disposable)),
  )

export const dispose = pipe(
  RefDisposable.get,
  E.map((d) => d.dispose()),
  E.chainFirstW(() => RefDisposable.remove),
)

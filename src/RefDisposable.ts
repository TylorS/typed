import { Disposable } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { settable } from './Disposable'
import * as E from './Env'
import * as RS from './ReaderStream'
import * as Ref from './Ref'

const RefDisposable = Ref.make(E.fromIO(settable), {
  eq: EqStrict,
  id: Symbol('RefDisposable'),
})

export const get = Ref.get(RefDisposable)

export const add = (disposable: Disposable) =>
  pipe(
    Ref.get(RefDisposable),
    E.map((s) => s.addDisposable(disposable)),
  )

export const dispose = pipe(
  Ref.get(RefDisposable),
  E.map((s) => s.dispose()),
  E.chainFirstW(() => Ref.remove(RefDisposable)),
)

export const disposeOfRefs = <E, A>(rs: RS.ReaderStream<E, A>): RS.ReaderStream<E & Ref.Get, A> =>
  pipe(
    get,
    RS.fromEnv,
    RS.switchMapW((d) => pipe(rs, RS.onDispose(d))),
  )

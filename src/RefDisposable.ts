/**
 * RefDisposable is an abstraction over [Ref](./Ref.ts.md) to keep track of
 * all resources created within the context of a particular instance of Refs.
 * @since 0.9.2
 */
import { Disposable } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { settable } from './Disposable'
import * as E from './Env'
import * as Ref from './Ref'

const RefDisposable = Ref.make(E.fromIO(settable), {
  eq: EqStrict,
  id: Symbol('RefDisposable'),
})

/**
 * @since 0.9.2
 * @category Combinator
 */
export const get = Ref.get(RefDisposable)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const add = (disposable: Disposable) =>
  pipe(
    Ref.get(RefDisposable),
    E.map((s) => s.addDisposable(disposable)),
  )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const dispose = pipe(
  Ref.get(RefDisposable),
  E.map((s) => s.dispose()),
  E.chainFirstW(() => Ref.remove(RefDisposable)),
)

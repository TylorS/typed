/**
 * RefDisposable is a collection of helpers for working with Refs that manage resources.
 * @since 0.11.0
 */
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'

import * as E from './Env'
import * as KV from './KV'
import * as Ref from './Ref'

/**
 * A Ref for tracking resources that can be disposed of.
 * @since 0.11.0
 * @category Ref
 */
export const RefDisposable = Ref.fromKV(KV.Disposable)

/**
 * @since 0.11.0
 * @category Effect
 */
export const get = RefDisposable.get

/**
 * @since 0.11.0
 * @category Effect
 */
export const remove = RefDisposable.remove

/**
 * @since 0.11.0
 * @category Effect
 */
export const add = (disposable: Disposable) =>
  pipe(
    RefDisposable.get,
    E.map((s) => s.addDisposable(disposable)),
  )

/**
 * @since 0.11.0
 * @category Effect
 */
export const dispose = pipe(
  RefDisposable.get,
  E.map((d) => d.dispose()),
  E.chainFirstW(() => RefDisposable.remove),
)

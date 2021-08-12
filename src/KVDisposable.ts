/**
 * KVDisposable is an abstraction over [KV](./KV.ts.md) to keep track of
 * your resources.
 * @since 0.11.0
 */
import { EqStrict } from 'fp-ts/Eq'

import { settable } from './Disposable'
import * as E from './Env'
import * as KV from './KV'

/**
 * @since 0.11.0
 * @category Combinator
 */
export const KVDisposable = KV.make(E.fromIO(settable), {
  ...EqStrict,
  key: Symbol('KVDisposable'),
})

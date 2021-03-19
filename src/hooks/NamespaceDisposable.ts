import { EqStrict } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3 } from 'fp-ts/dist/FromIO'
import { HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { settable, SettableDisposable } from '../Disposable'
import { createShared, Shared, Shared2, Shared3, Shared4 } from '../Shared'

export const NAMESPACE_DISPOSABLE = Symbol('NamespaceDisposable')

export function createNamespaceDisposable<F extends URIS2, E = never>(
  M: FromIO2<F>,
): Shared2<F, typeof NAMESPACE_DISPOSABLE, E, SettableDisposable>

export function createNamespaceDisposable<F extends URIS3, R = never, E = never>(
  M: FromIO3<F>,
): Shared3<F, typeof NAMESPACE_DISPOSABLE, R, E, SettableDisposable>

export function createNamespaceDisposable<F extends URIS4, S = never, R = never, E = never>(
  M: FromIO3<F>,
): Shared4<F, typeof NAMESPACE_DISPOSABLE, S, R, E, SettableDisposable>

export function createNamespaceDisposable<F, E = never>(
  M: FromIO<F>,
): Shared<F, typeof NAMESPACE_DISPOSABLE, E, SettableDisposable>

export function createNamespaceDisposable<F, E = never>(M: FromIO<F>) {
  return createShared<F>()(
    NAMESPACE_DISPOSABLE,
    M.fromIO(settable) as HKT2<F, E, SettableDisposable>,
    EqStrict,
  )
}

import { settable, SettableDisposable } from '@typed/fp/Disposable'
import { createKV, KV, KV2, KV3, KV4 } from '@typed/fp/KV'
import { EqStrict } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3 } from 'fp-ts/dist/FromIO'
import { HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export const NAMESPACE_DISPOSABLE = Symbol('NamespaceDisposable')

export function createNamespaceDisposable<F extends URIS2, E = never>(
  M: FromIO2<F>,
): KV2<F, typeof NAMESPACE_DISPOSABLE, E, SettableDisposable>

export function createNamespaceDisposable<F extends URIS3, R = never, E = never>(
  M: FromIO3<F>,
): KV3<F, typeof NAMESPACE_DISPOSABLE, R, E, SettableDisposable>

export function createNamespaceDisposable<F extends URIS4, S = never, R = never, E = never>(
  M: FromIO3<F>,
): KV4<F, typeof NAMESPACE_DISPOSABLE, S, R, E, SettableDisposable>

export function createNamespaceDisposable<F, E = never>(
  M: FromIO<F>,
): KV<F, typeof NAMESPACE_DISPOSABLE, E, SettableDisposable>

export function createNamespaceDisposable<F, E = never>(M: FromIO<F>) {
  return createKV<F>()(
    NAMESPACE_DISPOSABLE,
    M.fromIO(settable) as HKT2<F, E, SettableDisposable>,
    EqStrict,
  )
}

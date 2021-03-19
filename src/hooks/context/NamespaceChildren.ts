import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { Namespace } from '@typed/fp/Namespace'
import {
  createShared,
  getShared,
  RuntimeEnv,
  Shared,
  Shared2,
  Shared3,
  Shared4,
} from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { EqStrict } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export const NAMESPACE_CHILDREN = Symbol('NamespaceChildren')

export function createNamespaceChildren<F extends URIS2, E = never>(
  M: FromIO2<F>,
): Shared2<F, typeof NAMESPACE_CHILDREN, E, Set<Namespace>>

export function createNamespaceChildren<F extends URIS3, R = never, E = never>(
  M: FromIO3<F>,
): Shared3<F, typeof NAMESPACE_CHILDREN, R, E, Set<Namespace>>

export function createNamespaceChildren<F extends URIS4, S = never, R = never, E = never>(
  M: FromIO3<F>,
): Shared4<F, typeof NAMESPACE_CHILDREN, S, R, E, Set<Namespace>>

export function createNamespaceChildren<F, E = never>(
  M: FromIO<F>,
): Shared<F, typeof NAMESPACE_CHILDREN, E, Set<Namespace>>

export function createNamespaceChildren<F>(M: FromIO<F>) {
  return createShared<F>()(
    NAMESPACE_CHILDREN,
    M.fromIO(() => new Set<Namespace>()) as HKT2<F, any, Set<Namespace>>,
    EqStrict,
  )
}

export function createGetNamespaceChildren<F extends URIS2, E = never>(
  M: MonadReader2<F> & FromIO2<F>,
): Kind2<F, WidenI<RuntimeEnv<F> | E>, Set<Namespace>>

export function createGetNamespaceChildren<F extends URIS3, R = never, E = never>(
  M: MonadReader3<F> & FromIO3<F>,
): Kind3<F, WidenI<RuntimeEnv<F> | R>, E, Set<Namespace>>

export function createGetNamespaceChildren<F extends URIS3, R = never, E = never>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): Kind3<F, WidenI<RuntimeEnv<F> | R>, E, Set<Namespace>>

export function createGetNamespaceChildren<F extends URIS4, S = never, R = never, E = never>(
  M: MonadReader4<F> & FromIO4<F>,
): Kind4<F, S, WidenI<RuntimeEnv<F> | R>, E, Set<Namespace>>

export function createGetNamespaceChildren<F, E = never>(
  M: MonadReader<F> & FromIO<F>,
): HKT2<F, E, Set<Namespace>>

export function createGetNamespaceChildren<F>(M: MonadReader<F> & FromIO<F>) {
  return getShared(M)(createNamespaceChildren(M))
}

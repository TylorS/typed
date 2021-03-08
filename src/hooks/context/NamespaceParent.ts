import {
  MonadAsk,
  MonadAsk2,
  MonadAsk2C,
  MonadAsk3,
  MonadAsk3C,
  MonadAsk4,
  MonadAsk4C,
} from '@typed/fp/MonadAsk'
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
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { none, Option } from 'fp-ts/dist/Option'
import { Pointed, Pointed2, Pointed3 } from 'fp-ts/dist/Pointed'

export const NAMESPACE_PARENT = Symbol('NamespaceParent')

export function createNamespaceParent<F extends URIS2, E = never>(
  M: Pointed2<F>,
): Shared2<F, typeof NAMESPACE_PARENT, E, Option<Namespace>>

export function createNamespaceParent<F extends URIS3, R = never, E = never>(
  M: Pointed3<F>,
): Shared3<F, typeof NAMESPACE_PARENT, R, E, Option<Namespace>>

export function createNamespaceParent<F extends URIS4, S = never, R = never, E = never>(
  M: Pointed3<F>,
): Shared4<F, typeof NAMESPACE_PARENT, S, R, E, Option<Namespace>>

export function createNamespaceParent<F>(
  M: Pointed<F>,
): Shared<F, typeof NAMESPACE_PARENT, Option<Namespace>>

export function createNamespaceParent<F>(M: Pointed<F>) {
  return createShared<F>()(NAMESPACE_PARENT, M.of<Option<Namespace>>(none), EqStrict)
}

export function createGetNamespaceParent<F extends URIS2, E = never>(
  M: MonadAsk2<F>,
): Kind2<F, WidenI<RuntimeEnv<F> | E>, Option<Namespace>>

export function createGetNamespaceParent<F extends URIS2, E = never>(
  M: MonadAsk2C<F, E>,
): Kind2<F, WidenI<RuntimeEnv<F> | E>, Option<Namespace>>

export function createGetNamespaceParent<F extends URIS3, R = never, E = never>(
  M: MonadAsk3<F>,
): Kind3<F, WidenI<RuntimeEnv<F> | R>, E, Option<Namespace>>

export function createGetNamespaceParent<F extends URIS3, R = never, E = never>(
  M: MonadAsk3C<F, E>,
): Kind3<F, WidenI<RuntimeEnv<F> | R>, E, Option<Namespace>>

export function createGetNamespaceParent<F extends URIS4, S = never, R = never, E = never>(
  M: MonadAsk4<F>,
): Kind4<F, S, R, E, Option<Namespace>>

export function createGetNamespaceParent<F extends URIS4, S = never, R = never, E = never>(
  M: MonadAsk4C<F, E>,
): Kind4<F, S, WidenI<RuntimeEnv<F> | R>, E, Option<Namespace>>

export function createGetNamespaceParent<F>(M: MonadAsk<F>): HKT<F, Option<Namespace>>

export function createGetNamespaceParent<F>(M: MonadAsk<F>) {
  return getShared(M)(createNamespaceParent(M))
}

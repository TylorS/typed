import {
  createKV,
  GetKV,
  getKV,
  GetKV2,
  GetKV3,
  GetKV3C,
  GetKV4,
  KV,
  KV2,
  KV3,
  KV4,
} from '@typed/fp/KV'
import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { Namespace } from '@typed/fp/Namespace'
import { WidenI } from '@typed/fp/Widen'
import { EqStrict } from 'fp-ts/dist/Eq'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { none, Option } from 'fp-ts/dist/Option'
import { Pointed, Pointed2, Pointed3 } from 'fp-ts/dist/Pointed'

export const NAMESPACE_PARENT = Symbol('NamespaceParent')

export function createNamespaceParent<F extends URIS2, E = never>(
  M: Pointed2<F>,
): KV2<F, typeof NAMESPACE_PARENT, E, Option<Namespace>>

export function createNamespaceParent<F extends URIS3, R = never, E = never>(
  M: Pointed3<F>,
): KV3<F, typeof NAMESPACE_PARENT, R, E, Option<Namespace>>

export function createNamespaceParent<F extends URIS4, S = never, R = never, E = never>(
  M: Pointed3<F>,
): KV4<F, typeof NAMESPACE_PARENT, S, R, E, Option<Namespace>>

export function createNamespaceParent<F, E = never>(
  M: Pointed<F>,
): KV<F, typeof NAMESPACE_PARENT, E, Option<Namespace>>

export function createNamespaceParent<F>(M: Pointed<F>) {
  return createKV<F>()(
    NAMESPACE_PARENT,
    M.of<Option<Namespace>>(none) as HKT2<F, any, Option<Namespace>>,
    EqStrict,
  )
}

export function createGetNamespaceParent<F extends URIS2, E = never>(
  M: MonadReader2<F>,
): Kind2<F, WidenI<GetKV2<F> | E>, Option<Namespace>>

export function createGetNamespaceParent<F extends URIS3, R = never, E = never>(
  M: MonadReader3<F>,
): Kind3<F, WidenI<GetKV3<F> | R>, E, Option<Namespace>>

export function createGetNamespaceParent<F extends URIS3, R = never, E = never>(
  M: MonadReader3C<F, E>,
): Kind3<F, WidenI<GetKV3C<F, E> | R>, E, Option<Namespace>>

export function createGetNamespaceParent<F extends URIS4, S = never, R = never, E = never>(
  M: MonadReader4<F>,
): Kind4<F, S, WidenI<GetKV4<F> | R>, E, Option<Namespace>>

export function createGetNamespaceParent<F, E = never>(
  M: MonadReader<F>,
): HKT2<F, WidenI<GetKV<F> | E>, Option<Namespace>>

export function createGetNamespaceParent<F>(M: MonadReader<F>) {
  return getKV(M)(createNamespaceParent(M))
}

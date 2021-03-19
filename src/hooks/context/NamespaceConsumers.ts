import { createKV, GetKV, getKV, GetKV2, GetKV3, GetKV4, KV, KV2, KV3, KV4 } from '@typed/fp/KV'
import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { Namespace } from '@typed/fp/Namespace'
import { WidenI } from '@typed/fp/Widen'
import { Eq, EqStrict } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export const NAMESPACE_CONSUMERS = Symbol('NamespaceConsumers')

export type NamespaceConsumersMap = Map<any, Map<Namespace, Set<Eq<unknown>>>>

export function createNamespaceConsumers<F extends URIS2, E = never>(
  M: FromIO2<F>,
): KV2<F, typeof NAMESPACE_CONSUMERS, E, NamespaceConsumersMap>

export function createNamespaceConsumers<F extends URIS3, R = never, E = never>(
  M: FromIO3<F>,
): KV3<F, typeof NAMESPACE_CONSUMERS, R, E, NamespaceConsumersMap>

export function createNamespaceConsumers<F extends URIS4, S = never, R = never, E = never>(
  M: FromIO3<F>,
): KV4<F, typeof NAMESPACE_CONSUMERS, S, R, E, NamespaceConsumersMap>

export function createNamespaceConsumers<F, E = never>(
  M: FromIO<F>,
): KV<F, typeof NAMESPACE_CONSUMERS, E, NamespaceConsumersMap>

export function createNamespaceConsumers<F>(M: FromIO<F>) {
  return createKV<F>()(
    NAMESPACE_CONSUMERS,
    M.fromIO((): NamespaceConsumersMap => new Map()) as HKT2<F, any, NamespaceConsumersMap>,
    EqStrict,
  )
}

export function createGetNamespaceConsumers<F extends URIS2, E = never>(
  M: MonadReader2<F> & FromIO2<F>,
): Kind2<F, WidenI<GetKV2<F> | E>, NamespaceConsumersMap>

export function createGetNamespaceConsumers<F extends URIS3, R = never, E = never>(
  M: MonadReader3<F> & FromIO3<F>,
): Kind3<F, WidenI<GetKV3<F> | R>, E, NamespaceConsumersMap>

export function createGetNamespaceConsumers<F extends URIS3, R = never, E = never>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): Kind3<F, WidenI<GetKV3<F> | R>, E, NamespaceConsumersMap>

export function createGetNamespaceConsumers<F extends URIS4, S = never, R = never, E = never>(
  M: MonadReader4<F> & FromIO4<F>,
): Kind4<F, S, WidenI<GetKV4<F> | R>, E, NamespaceConsumersMap>

export function createGetNamespaceConsumers<F, E = never>(
  M: MonadReader<F> & FromIO<F>,
): HKT2<F, WidenI<GetKV<F> | E>, NamespaceConsumersMap>

export function createGetNamespaceConsumers<F>(M: MonadReader<F> & FromIO<F>) {
  return getKV(M)(createNamespaceConsumers(M))
}

import * as KV from '@typed/fp/KV'
import { DeleteKV2, GetKV2, SetKV2 } from '@typed/fp/KV'
import { WidenI } from '@typed/fp/Widen'
import { Eq } from 'fp-ts/dist/Eq'
import { Option } from 'fp-ts/dist/Option'

import { Eff } from '../Eff'
import { FromReader, Functor, MonadReader, URI } from '../fp-ts'

export interface EffKV<K, E, A> extends KV.KV2<URI, K, E, A> {}

export const createKV: <K, E, A>(
  key: K,
  initial: Eff<E, A>,
  eq?: Eq<A>,
) => EffKV<K, E, A> = KV.createKV<URI>()

export const modifyKV: <A>(
  f: (value: A) => A,
) => <K, E>(shared: EffKV<K, E, A>) => Eff<WidenI<E | SetKV2<URI> | GetKV2<URI>>, A> = KV.modifyKV(
  MonadReader,
)

export const getKV: <K, E, A>(shared: EffKV<K, E, A>) => Eff<WidenI<E | GetKV2<URI>>, A> = KV.getKV(
  MonadReader,
)

export const setKV: <A>(
  value: A,
) => <K, E>(shared: EffKV<K, E, A>) => Eff<WidenI<E | SetKV2<URI>>, A> = KV.setKV(MonadReader)

export const deleteKV: <K, E, A>(
  shared: EffKV<K, E, A>,
) => Eff<WidenI<E | DeleteKV2<URI>>, Option<A>> = KV.deleteKV(MonadReader)

export const fromKey: <A>(
  eq?: Eq<A> | undefined,
) => <K extends string | number | symbol>(
  key: K,
) => EffKV<K, Readonly<Record<K, A>>, A> = KV.fromKey({ ...FromReader, ...Functor })

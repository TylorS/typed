import { Eq } from '@typed/fp/Eq'
import * as KV from '@typed/fp/KV'
import { WidenI } from '@typed/fp/Widen'
import { Option } from 'fp-ts/dist/Option'

import { Eff } from './Eff'
import { FromReader, Functor, MonadReader, URI } from './fp-ts'

export interface EffKV<K, E, A> extends KV.KV2<URI, K, E, A> {}

export const createKV: <K, E, A>(
  key: K,
  initial: Eff<E, A>,
  eq?: Eq<A>,
) => EffKV<K, E, A> = KV.createKV<URI>()

export const fromKey: <A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => EffKV<K, Readonly<Record<K, A>>, A> = KV.fromKey({
  ...FromReader,
  ...Functor,
})

export const deleteKV: <K, E, A>(
  kv: EffKV<K, E, A>,
) => Eff<WidenI<E | KV.DeleteKV2<URI>>, Option<A>> = KV.deleteKV(MonadReader)

export const dep: <A>() => <K extends PropertyKey>(
  key: K,
) => Eff<WidenI<Readonly<Record<K, A>> | KV.GetKV2<URI>>, A> = KV.dep(MonadReader)

export const getKV: <K, E, A>(kv: EffKV<K, E, A>) => Eff<WidenI<E | KV.GetKV2<URI>>, A> = KV.getKV(
  MonadReader,
)

export const modifyKV: <A>(
  f: (value: A) => A,
) => <K, E>(
  kv: EffKV<K, E, A>,
) => Eff<WidenI<E | KV.SetKV2<URI> | KV.GetKV2<URI>>, A> = KV.modifyKV(MonadReader)

export const op: <Op>() => <K extends PropertyKey>(
  key: K,
) => <E, A>(
  f: (op: Op) => Eff<E, A>,
) => Eff<WidenI<E | Readonly<Record<K, Op>> | KV.GetKV2<URI>>, A> = KV.op(MonadReader)

export const setKV: <A>(
  value: A,
) => <K, E>(kv: EffKV<K, E, A>) => Eff<WidenI<E | KV.SetKV2<URI>>, A> = KV.setKV(MonadReader)

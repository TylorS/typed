import {
  createShared as createShared_,
  deleteShared as deleteShared_,
  DeleteShared2,
  fromKey as fromKey_,
  getShared as getShared_,
  GetShared2,
  modifyShared as modifyShared_,
  setShared as setShared_,
  SetShared2,
  Shared2,
} from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { Eq } from 'fp-ts/dist/Eq'
import { Option } from 'fp-ts/dist/Option'
import { FromReader, Functor, Reader, URI } from 'fp-ts/dist/Reader'

import { MonadReader } from '../MonadReader'

export interface ReaderShared<K, E, A> extends Shared2<URI, K, E, A> {}

export const createShared: <K, E, A>(
  key: K,
  initial: Reader<E, A>,
  eq?: Eq<A>,
) => ReaderShared<K, E, A> = createShared_<URI>()

export const modifyShared: <A>(
  f: (value: A) => A,
) => <K, E>(
  shared: ReaderShared<K, E, A>,
) => Reader<WidenI<E | SetShared2<URI> | GetShared2<URI>>, A> = modifyShared_(MonadReader)

export const getShared: <K, E, A>(
  shared: ReaderShared<K, E, A>,
) => Reader<WidenI<E | GetShared2<URI>>, A> = getShared_(MonadReader)

export const setShared: <A>(
  value: A,
) => <K, E>(shared: ReaderShared<K, E, A>) => Reader<WidenI<E | SetShared2<URI>>, A> = setShared_(
  MonadReader,
)

export const deleteShared: <K, E, A>(
  shared: ReaderShared<K, E, A>,
) => Reader<WidenI<E | DeleteShared2<URI>>, Option<A>> = deleteShared_(MonadReader)

export const fromKey: <A>(
  eq?: Eq<A> | undefined,
) => <K extends string | number | symbol>(
  key: K,
) => ReaderShared<K, Readonly<Record<K, A>>, A> = fromKey_({ ...FromReader, ...Functor })

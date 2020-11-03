import { lazy, LazyDisposable } from '@typed/fp/Disposable/exports'
import { Pure } from '@typed/fp/Effect/exports'
import { getShared, shared } from '@typed/fp/Shared/domain/exports'

export const NamespaceDisposable = shared(
  Symbol('NamespaceDisposable'),
  Pure.fromIO((): LazyDisposable => lazy()),
)

export const getNamespaceDisposable = getShared(NamespaceDisposable)

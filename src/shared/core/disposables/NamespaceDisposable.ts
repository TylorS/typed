import { lazy, LazyDisposable } from '@typed/fp/Disposable/exports'
import { Pure } from '@typed/fp/Effect/exports'

import { createShared } from '../constructors/exports'
import { getShared } from '../services/exports'

/**
 * Introduces a well-known place to associate resources with a given
 * Namespace.
 */
export const NamespaceDisposable = createShared(
  Symbol.for('NamespaceDisposable'),
  Pure.fromIO((): LazyDisposable => lazy()),
)

export const getNamespaceDisposable = getShared(NamespaceDisposable)

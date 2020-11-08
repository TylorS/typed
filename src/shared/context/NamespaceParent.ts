import { Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, Namespace, setShared } from '@typed/fp/Shared/core/exports'
import { none, Option } from 'fp-ts/Option'

export const NamespaceParent = createShared(
  Symbol('NamespaceParent'),
  Pure.fromIO((): Option<Namespace> => none),
)

export const getNamespaceParent = getShared(NamespaceParent)
export const setNamespaceParent = setShared(NamespaceParent)

import { Pure } from '@typed/fp/Effect/exports'
import { getShared, Namespace, setShared, shared } from '@typed/fp/Shared/domain/exports'
import { none, Option } from 'fp-ts/Option'

export const NamespaceParent = shared(
  Symbol('NamespaceParent'),
  Pure.fromIO((): Option<Namespace> => none),
)

export const getNamespaceParent = getShared(NamespaceParent)
export const setNamespaceParent = setShared(NamespaceParent)

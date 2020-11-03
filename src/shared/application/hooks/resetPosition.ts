import { setShared } from '@typed/fp/Shared/domain/exports'

import { NamespacePosition } from './NamespacePosition'

export const resetPosition = setShared(NamespacePosition, 0)

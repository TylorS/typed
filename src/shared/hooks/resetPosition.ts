import { setShared } from '@typed/fp/Shared/core/exports'

import { NamespacePosition } from './NamespacePosition'

export const resetPosition = setShared(NamespacePosition, 0)

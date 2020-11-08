import { setShared } from '@typed/fp/shared/core/exports'

import { NamespacePosition } from './NamespacePosition'

export const resetPosition = setShared(NamespacePosition, 0)

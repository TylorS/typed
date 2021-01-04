import { usingNamespace } from '@fp/Shared/core/exports'

import { GlobalNamespace } from './Global'

/**
 * Perform an effect using the Global Namespace
 */
export const usingGlobal = usingNamespace(GlobalNamespace)

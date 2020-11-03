import { usingNamespace } from '@typed/fp/Shared/domain/exports'

import { GlobalNamespace } from '../model/exports'

/**
 * Perform an effect using the Global Namespace
 */
export const usingGlobal = usingNamespace(GlobalNamespace)

import { Namespace } from '@typed/fp/Shared/core/exports'

/**
 * A namespace to be used as if it is global state.
 */
export const GlobalNamespace = Namespace.wrap(Symbol.for('@typed/fp/Global'))

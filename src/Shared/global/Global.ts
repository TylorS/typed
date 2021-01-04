import { Namespace } from '@fp/Shared/core/exports'

/**
 * A namespace to be used as if it is global state.
 */
export const GlobalNamespace = Namespace.wrap(Symbol.for('@fp/Global'))

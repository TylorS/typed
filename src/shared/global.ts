import { usingNamespace } from './useingNamespace'

/**
 * A namespace to be used as if it is global state.
 */
export const GLOBAL_NAMESPACE = Symbol.for('@typed/fp/Global')

/**
 * Helper for running effects within. the Global namespace. Can be
 * used to model singletons.
 */
export const usingGlobal = usingNamespace(GLOBAL_NAMESPACE)

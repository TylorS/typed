import { URI } from './Env'
import { Provider2 } from './Provide'
import { createReferences, References, Refs } from './Ref'

/**
 * The key to access global references from the environment
 */
export const Global = Symbol('@typed/fp/Global')
export type Global = typeof Global

/**
 * The environment type for global references
 */
export type GlobalRefs = {
  readonly [Global]: References
}

/**
 * Run an Env with GlobalRefs
 */
export const usingGlobalRefs: Provider2<URI, Refs, GlobalRefs> = (env) => (e) =>
  env({ ...e, refs: e[Global] })

/**
 * Create a unique instance of GlobalRefs
 */
export const createGlobalRefs = (): GlobalRefs => ({
  [Global]: createReferences(),
})

/**
 * A singleton to use for truly global references, be careful with this :)
 */
export const globalRefs = createGlobalRefs()

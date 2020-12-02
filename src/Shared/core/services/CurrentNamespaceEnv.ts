import { Namespace } from '../model/exports'

/**
 * An environment type for the current Namespace
 */
export interface CurrentNamespaceEnv extends Record<'currentNamespace', Namespace> {}

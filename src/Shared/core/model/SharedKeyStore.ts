import { GetSharedKey, GetSharedValue, Shared } from './Shared'

/**
 * A Map of SharedKeys to Shared values.
 */
export interface SharedKeyStore<S extends Shared = Shared>
  extends Map<GetSharedKey<S>, GetSharedValue<S>> {}

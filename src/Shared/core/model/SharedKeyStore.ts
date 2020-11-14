import { GetSharedKey, GetSharedValue, Shared } from './Shared'

export interface SharedKeyStore<S extends Shared = Shared>
  extends Map<GetSharedKey<S>, GetSharedValue<S>> {}

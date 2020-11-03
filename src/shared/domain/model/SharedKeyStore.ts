import { KeyOf, Shared, ValueOf } from './Shared'

export interface SharedKeyStore<S extends Shared = Shared> extends Map<KeyOf<S>, ValueOf<S>> {}

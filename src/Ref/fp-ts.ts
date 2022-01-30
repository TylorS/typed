import { Functor4 } from 'fp-ts/Functor'

import { map } from './map'
import { Ref } from './Ref'

export const URI = '@typed/fp/Ref'
export type URI = '@typed/fp/Ref'

declare module 'fp-ts/HKT' {
  export interface URItoKind4<S, R, E, A> {
    [URI]: Ref<S, R, E, A>
  }
}

export const Functor: Functor4<URI> = {
  map: map,
}

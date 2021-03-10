import {
  CurrentNamespace,
  getCurrentNamespace as getNamespace_,
  Namespace,
  usingNamespace as usingNamespace_,
} from '@typed/fp/Namespace'
import { Functor, Reader } from 'fp-ts/dist/Reader'

import { Ask } from '../ask'
import { UseSome } from '../provide'

export const getCurrentNamespace: <K extends PropertyKey = PropertyKey>() => Reader<
  CurrentNamespace<K>,
  Namespace<K>
> = getNamespace_({ ...Ask, ...Functor })

export const usingNamespace: <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => {
  <A>(reader: Reader<CurrentNamespace<K>, A>): Reader<never, A>
  <E, A>(reader: Reader<E & CurrentNamespace<K>, A>): Reader<E, A>
} = usingNamespace_(UseSome)

import {
  CurrentNamespace,
  getCurrentNamespace as getNamespace_,
  Namespace,
  usingNamespace as usingNamespace_,
} from '@typed/fp/Namespace'
import { Ask, Functor, Reader, UseSome } from '@typed/fp/Reader'

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

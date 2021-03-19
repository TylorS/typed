import {
  CurrentNamespace,
  getCurrentNamespace as getNamespace_,
  Namespace,
  usingNamespace as usingNamespace_,
} from '@typed/fp/Namespace'

import { Env } from '../Env'
import { FromReader, Functor, UseSome } from '../fp-ts'

export const getCurrentNamespace: <K extends PropertyKey = PropertyKey>() => Env<
  CurrentNamespace<K>,
  Namespace<K>
> = getNamespace_({ ...FromReader, ...Functor })

export const usingNamespace: <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => {
  <A>(reader: Env<CurrentNamespace<K>, A>): Env<never, A>
  <E, A>(reader: Env<E & CurrentNamespace<K>, A>): Env<E, A>
} = usingNamespace_(UseSome)

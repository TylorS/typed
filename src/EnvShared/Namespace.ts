import { Ask, Env, Functor, UseSome } from '@typed/fp/Env'
import {
  CurrentNamespace,
  getCurrentNamespace as getNamespace_,
  Namespace,
  usingNamespace as usingNamespace_,
} from '@typed/fp/Namespace'

export const getCurrentNamespace: <K extends PropertyKey = PropertyKey>() => Env<
  CurrentNamespace<K>,
  Namespace<K>
> = getNamespace_({ ...Ask, ...Functor })

export const usingNamespace: <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => {
  <A>(reader: Env<CurrentNamespace<K>, A>): Env<never, A>
  <E, A>(reader: Env<E & CurrentNamespace<K>, A>): Env<E, A>
} = usingNamespace_(UseSome)

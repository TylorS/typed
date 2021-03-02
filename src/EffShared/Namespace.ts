import { Ask, Eff, Functor, UseSome } from '@typed/fp/Eff'
import {
  CurrentNamespace,
  getCurrentNamespace as getNamespace_,
  Namespace,
  usingNamespace as usingNamespace_,
} from '@typed/fp/Namespace'

export const getCurrentNamespace: <K extends PropertyKey = PropertyKey>() => Eff<
  CurrentNamespace<K>,
  Namespace<K>
> = getNamespace_({ ...Ask, ...Functor })

export const usingNamespace: <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => {
  <A>(reader: Eff<CurrentNamespace<K>, A>): Eff<never, A>
  <E, A>(reader: Eff<E & CurrentNamespace<K>, A>): Eff<E, A>
} = usingNamespace_(UseSome)

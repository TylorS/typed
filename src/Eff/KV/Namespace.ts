import {
  CurrentNamespace,
  getCurrentNamespace as getNamespace_,
  Namespace,
  usingNamespace as usingNamespace_,
} from '@typed/fp/Namespace'

import { Eff } from '../Eff'
import { FromReader, Functor, UseSome } from '../fp-ts'

export const getCurrentNamespace: <K extends PropertyKey = PropertyKey>() => Eff<
  CurrentNamespace<K>,
  Namespace<K>
> = getNamespace_({ ...FromReader, ...Functor })

export const usingNamespace: <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => {
  <A>(reader: Eff<CurrentNamespace<K>, A>): Eff<never, A>
  <E, A>(reader: Eff<E & CurrentNamespace<K>, A>): Eff<E, A>
} = usingNamespace_(UseSome)

import { Provider, useSome } from '@typed/fp/Effect/exports'

import { Namespace } from '../model/exports'
import { CurrentNamespaceEnv } from './CurrentNamespaceEnv'

export const usingNamespace = (namespace: Namespace): Provider<CurrentNamespaceEnv> =>
  useSome({ currentNamespace: namespace })

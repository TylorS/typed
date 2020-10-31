import { Provider, useSome } from '@typed/fp/Effect/provide'

export const usingNamespace = (
  namespace: PropertyKey,
): Provider<{ readonly currentNamespace: PropertyKey }> => useSome({ currentNamespace: namespace })

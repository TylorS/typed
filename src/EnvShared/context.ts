import { ChainRec, FromIO, MonadAsk, MonadRec, Pointed, URI, UseSome } from '@typed/fp/Env'
import * as C from '@typed/fp/hooks/context'

const env = { ...MonadAsk, ...FromIO }

export const addToTree = C.createAddToTree({ ...env, ...UseSome })

export const NamespaceConsumers = C.createNamespaceConsumers(FromIO)
export const createGetNamespaceConsumers = C.createGetNamespaceConsumers(env)

export const NamespaceChildren = C.createNamespaceChildren(FromIO)
export const getNamespaceChildren = C.createGetNamespaceChildren(env)

export const NamespaceParent = C.createNamespaceParent(Pointed)
export const getNamespaceParent = C.createGetNamespaceParent(env)

export const NamespaceProviders = C.createNamespaceProviders(FromIO)
export const getNamespaceProviders = C.createGetNamespaceProviders(env)

export const useContext = C.createUseContext({ ...env, ...UseSome, ...ChainRec })

export const withProvider = C.createWithProvider({ ...env, ...UseSome, ...ChainRec })

export const contextHandlers: C.ContextHandlers<URI> = C.createContextHandlers({
  ...env,
  ...UseSome,
  ...MonadRec,
})

import * as C from '@typed/fp/hooks/context'

import { ChainRec, FromIO, MonadAsk, MonadRec, Pointed, URI, UseSome } from '../fp-ts'

const eff = { ...MonadAsk, ...FromIO }

export const addToTree = C.createAddToTree({ ...eff, ...UseSome })

export const NamespaceConsumers = C.createNamespaceConsumers(FromIO)
export const createGetNamespaceConsumers = C.createGetNamespaceConsumers(eff)

export const NamespaceChildren = C.createNamespaceChildren(FromIO)
export const getNamespaceChildren = C.createGetNamespaceChildren(eff)

export const NamespaceParent = C.createNamespaceParent(Pointed)
export const getNamespaceParent = C.createGetNamespaceParent(eff)

export const NamespaceProviders = C.createNamespaceProviders(FromIO)
export const getNamespaceProviders = C.createGetNamespaceProviders(eff)

export const useContext = C.createUseContext({ ...eff, ...UseSome, ...ChainRec })
export const useContextState = C.createUseContextState({ ...eff, ...UseSome, ...ChainRec })

export const withProvider = C.createWithProvider({ ...eff, ...UseSome, ...ChainRec })

export const contextHandlers: C.ContextHandlers<URI> = C.createContextHandlers({
  ...eff,
  ...UseSome,
  ...MonadRec,
})

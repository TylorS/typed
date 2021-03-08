import * as C from '@typed/fp/hooks/context'
import { ChainRec, FromIO, MonadAsk, MonadRec, Pointed, URI, UseSome } from '@typed/fp/Reader'

const reader = { ...MonadAsk, ...FromIO }

export const addToTree = C.createAddToTree({ ...reader, ...UseSome })

export const NamespaceConsumers = C.createNamespaceConsumers(FromIO)
export const createGetNamespaceConsumers = C.createGetNamespaceConsumers(reader)

export const NamespaceChildren = C.createNamespaceChildren(FromIO)
export const getNamespaceChildren = C.createGetNamespaceChildren(reader)

export const NamespaceParent = C.createNamespaceParent(Pointed)
export const getNamespaceParent = C.createGetNamespaceParent(reader)

export const NamespaceProviders = C.createNamespaceProviders(FromIO)
export const getNamespaceProviders = C.createGetNamespaceProviders(reader)

export const useContext = C.createUseContext({ ...reader, ...UseSome, ...ChainRec })
export const useContextState = C.createUseContextState({ ...reader, ...UseSome, ...ChainRec })

export const withProvider = C.createWithProvider({ ...reader, ...UseSome, ...ChainRec })

export const contextHandlers: C.ContextHandlers<URI> = C.createContextHandlers({
  ...reader,
  ...UseSome,
  ...MonadRec,
})

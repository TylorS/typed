import * as H from '@typed/fp/hooks'
import { MonadAsk, FromIO, URI, Reader } from '@typed/fp/Reader'
import { RuntimeEnv } from '@typed/fp/Shared'
import { Ref } from '@typed/fp/Ref'
import { Eq } from 'fp-ts/dist/Eq'
import { WidenI } from '@typed/fp/Widen'
import { UseState2 } from '@typed/fp/hooks/UseState'

const eff = { ...MonadAsk, ...FromIO }

export const getNextIndex: Reader<RuntimeEnv<URI>, number> = H.createGetNextIndex(eff)()
export const getNextSymbol: Reader<RuntimeEnv<URI>, symbol> = H.createGetNextSymbol(eff)()
export const resetIndex: Reader<RuntimeEnv<URI>, void> = H.createResetIndex(eff)()

export const getSharedMap: Reader<RuntimeEnv<URI>, Map<any, any>> = H.createGetSharedMap(eff)

export const useRef: {
  <A>(): Reader<RuntimeEnv<URI>, Ref<A | undefined>>
  <A>(value: A): Reader<RuntimeEnv<URI>, Ref<A>>
} = H.createUseRef(eff)

export const useState: <E, A>(
  initial: Reader<E, A>,
  eq?: Eq<A>,
) => Reader<WidenI<RuntimeEnv<URI> | E>, UseState2<URI, A, A>> = H.createUseState(eff)

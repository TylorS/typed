import * as H from '@typed/fp/hooks'
import { MonadAsk, FromIO, URI, Eff } from '@typed/fp/Eff'
import { RuntimeEnv } from '@typed/fp/Shared'
import { Ref } from '@typed/fp/Ref'
import { Eq } from 'fp-ts/dist/Eq'
import { WidenI } from '@typed/fp/Widen'
import { UseState2 } from '@typed/fp/hooks/UseState'

const eff = { ...MonadAsk, ...FromIO }

export const getNextIndex: Eff<RuntimeEnv<URI>, number> = H.createGetNextIndex(eff)()
export const getNextSymbol: Eff<RuntimeEnv<URI>, symbol> = H.createGetNextSymbol(eff)()
export const resetIndex: Eff<RuntimeEnv<URI>, void> = H.createResetIndex(eff)()

export const getSharedMap: Eff<RuntimeEnv<URI>, Map<any, any>> = H.createGetSharedMap(eff)

export const useRef: {
  <A>(): Eff<RuntimeEnv<URI>, Ref<A | undefined>>
  <A>(value: A): Eff<RuntimeEnv<URI>, Ref<A>>
} = H.createUseRef(eff)

export const useState: <E, A>(
  initial: Eff<E, A>,
  eq?: Eq<A>,
) => Eff<WidenI<RuntimeEnv<URI> | E>, UseState2<URI, A, A>> = H.createUseState(eff)

import { Eq } from 'fp-ts/Eq'
import { identity, unsafeCoerce } from 'fp-ts/function'
import { HKT2 } from 'fp-ts/HKT'
import { Chain, UseAll, URI, FromReader, Env } from './Env'
import * as F from './Fiber'
import { FromEnv2 } from './FromEnv'

const FromEnv: FromEnv2<URI> = {
  fromEnv: identity,
}

export const fork = F.fork(FromEnv)
export const getChildren = F.getChildren(FromEnv)
export const getParent = F.getParent(FromEnv)
export const join = F.join(FromEnv)
export const kill = F.kill(FromEnv)
export const listenToEvents = F.listenToEvents({ ...FromEnv, ...UseAll })
export const pause = F.pause(FromEnv)
export const play = F.play(FromEnv)
export const sendEvent = F.sendEvent(FromEnv)

export const fromKey = F.fromKey(FromReader)
export const createRef = <E, A>(
  env: Env<E, A>,
  id?: PropertyKey,
  eq?: Eq<A>,
): F.FiberRef2<URI, E, A> => F.createRef(unsafeCoerce(env) as HKT2<URI, E, A>, id, eq)

export const getRef = F.getRef({ ...FromEnv, ...Chain })
export const setRef = F.setRef({ ...FromEnv, ...Chain })
export const deleteRef = F.setRef({ ...FromEnv, ...Chain })

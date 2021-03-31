import { identity } from 'fp-ts/function'

import { FromReader, URI, UseAll } from './Env'
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
export const getCurrentFiber = F.getCurrentFiber(FromReader)

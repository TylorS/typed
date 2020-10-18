import { ask, asks, doEffect, Pure } from '@typed/fp/Effect/exports'
import { isObject } from '@typed/fp/logic/is'
import { iso } from 'newtype-ts'

import { OpEnv, OpMap, OPS } from './exports'

const opEnvIso = iso<OpEnv<any>>()
const emptyOpEnv = (): OpEnv<any> => opEnvIso.wrap({ [OPS]: new Map() })

export const getOpMap = doEffect(function* () {
  const { [OPS]: map } = yield* asks(opEnvIso.unwrap)

  return map
})

export const getOrCreateOpMap: Pure<OpMap> = doEffect(function* () {
  const env = yield* ask<unknown>()

  if (isOpEnv(env)) {
    return opEnvIso.unwrap(env)[OPS]
  }

  const created = emptyOpEnv()

  const map = opEnvIso.unwrap(created)[OPS]

  return map
})

export function isOpEnv(env: unknown): env is OpEnv<any> {
  return isObject(env) && OPS in env
}

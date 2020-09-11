import { ask, asks, doEffect, Pure } from '@typed/fp/Effect/exports'
import { iso } from 'newtype-ts'

import { OpEnv, OpMap, OPS } from './exports'

const opEnvIso = iso<OpEnv<any>>()
const emptyOpEnv = (): OpEnv<any> => opEnvIso.wrap({ [OPS]: new Map() })

export const getOpMap = doEffect(function* () {
  const { [OPS]: map } = yield* asks(opEnvIso.unwrap)

  return map
})

export const getOrCreateOpMap: Pure<OpMap> = doEffect(function* () {
  const env = yield* ask<{}>()
  const { [OPS]: map } = opEnvIso.unwrap(isOpEnv(env) ? env : emptyOpEnv())

  return map
})

export function isOpEnv(env: object): env is OpEnv<any> {
  return !!env && typeof env === 'object' && OPS in env
}

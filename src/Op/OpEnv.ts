import { ask, asks, doEffect } from '@typed/fp/Effect'
import { iso } from 'newtype-ts'

import { OpEnv } from './Op'

const opEnvIso = iso<OpEnv<any>>()
const emptyOpEnv = (): OpEnv<any> => opEnvIso.wrap({ ops: new Map() })

export const getOpMap = doEffect(function* () {
  const { ops } = yield* asks(opEnvIso.unwrap)

  return ops
})

export const getOrCreateOpMap = doEffect(function* () {
  const env = yield* ask<Partial<OpEnv<any>>>()
  const { ops } = opEnvIso.unwrap('ops' in env ? env : emptyOpEnv())

  return ops
})

import { ask, chain, map } from '@typed/fp/Effect'
import { pipe } from 'fp-ts/es6/pipeable'
import { iso, prism } from 'newtype-ts'

import { Uuid, UuidEnv } from './common'
import { uuid4 } from './uuid4'

/**
 * @since 0.0.1
 */
export const uuidIso = iso<Uuid>()

/**
 * @since 0.0.1
 */
export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/**
 * @since 0.0.1
 */
export const uuidPrism = prism<Uuid>((s) => uuidRegex.test(s))

/**
 * @since 0.0.1
 */
export const createUuid = pipe(
  ask<UuidEnv>(),
  chain((e) => e.randomUuidSeed()),
  map(uuid4),
)

export * from './common'
export * from './randomUuidSeed'

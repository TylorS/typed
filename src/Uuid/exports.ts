import { ask, map } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/pipeable'
import { prism } from 'newtype-ts'

import { Uuid, UuidEnv } from './common'
import { uuid4 } from './uuid4/exports'

export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export const uuidPrism = prism<Uuid>((s) => uuidRegex.test(s))

export const createUuid = pipe(
  ask<UuidEnv>(),
  map((e) => e.randomUuidSeed()),
  map(uuid4),
)

export * from './common'
export * from './uuid4/exports'

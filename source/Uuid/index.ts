import { iso, Newtype, prism } from 'newtype-ts'
import { asks, Effect } from '../Effect'
import { UuidEnv } from './common'
import { uuid4 } from './uuid4'

export type Uuid = Newtype<{ readonly Uuid: unique symbol }, string>

export const uuidIso = iso<Uuid>()

export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export const uuidPrism = prism<Uuid>((s) => uuidRegex.test(s))

export const createUuid: Effect<UuidEnv, Uuid> = asks((e) => uuid4(e.randomUuidSeed()))

export * from './common'
export * from './randomUuidSeed'

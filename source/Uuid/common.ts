import { Newtype } from 'newtype-ts'
import { Pure } from '../Effect'

export type Uuid = Newtype<{ readonly Uuid: unique symbol }, string>

export type UuidSeed = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export interface UuidEnv {
  readonly randomUuidSeed: () => Pure<UuidSeed>
}

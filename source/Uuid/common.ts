import { PureEffect } from '../Effect'

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
  readonly randomUuidSeed: () => PureEffect<UuidSeed>
}

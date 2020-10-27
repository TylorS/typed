import { IO } from 'fp-ts/IO'
import { iso, Newtype } from 'newtype-ts'

export interface Uuid extends Newtype<'Uuid', string> {}

export const uuidIso = iso<Uuid>()

export namespace Uuid {
  export const { wrap, unwrap } = uuidIso
}

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
  readonly randomUuidSeed: IO<UuidSeed>
}

import { IO } from 'fp-ts/lib/IO'
import { iso, Newtype } from 'newtype-ts'

/**
 * @since 0.0.1
 */
export interface Uuid extends Newtype<{ readonly Uuid: unique symbol }, string> {}

export const uuidIso = iso<Uuid>()

export namespace Uuid {
  export const { wrap, unwrap } = uuidIso
}

/**
 * @since 0.0.1
 */
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

/**
 * @since 0.0.1
 */
export interface UuidEnv {
  readonly randomUuidSeed: IO<UuidSeed>
}

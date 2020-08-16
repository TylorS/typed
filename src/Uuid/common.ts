import { Pure } from '@typed/fpEffect'
import { Newtype } from 'newtype-ts'

/**
 * @since 0.0.1
 */
export type Uuid = Newtype<{ readonly Uuid: unique symbol }, string>

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
  readonly randomUuidSeed: () => Pure<UuidSeed>
}

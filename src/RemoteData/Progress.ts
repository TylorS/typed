import { Option } from 'fp-ts/Option'

/**
 * A type to represent loading progress
 */
export interface Progress {
  readonly loaded: number
  readonly total: Option<number>
}

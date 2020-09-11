import { Option } from 'fp-ts/Option'

export interface Progress {
  readonly loaded: number
  readonly total: Option<number>
}

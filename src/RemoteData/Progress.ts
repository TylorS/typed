import { Option } from 'fp-ts/es6/Option'

export interface Progress {
  readonly loaded: number
  readonly total: Option<number>
}

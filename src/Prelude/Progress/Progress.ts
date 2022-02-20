import { None, Option } from '../Option'

export interface Progress {
  readonly loaded: number
  readonly total: Option<number>
}

export const Progress = (loaded: number, total: Option<number> = None): Progress => ({
  loaded,
  total,
})

import { ReaderOption } from '@fp/ReaderOption'

import { ParamsOf } from './paths'

export interface Route<P extends string> {
  readonly path: P
  readonly match: ReaderOption<string, ParamsOf<P>>
  readonly createPath: (params: ParamsOf<P>) => string
}

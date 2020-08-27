import { fromNullable, Option } from 'fp-ts/es6/Option'

import { RemoteDataStatus } from './enums'
import { Progress } from './Progress'

export interface RefreshingSuccess<A> {
  readonly status: RemoteDataStatus.RefreshingSuccess
  readonly value: A
  readonly progress: Option<Progress>
}

export namespace RefreshingSuccess {
  export const of = <A>(value: A, progress?: Progress): RefreshingSuccess<A> => ({
    status: RemoteDataStatus.RefreshingSuccess,
    value,
    progress: fromNullable(progress),
  })
}

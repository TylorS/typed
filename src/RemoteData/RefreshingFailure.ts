import { fromNullable, Option } from 'fp-ts/es6/Option'

import { RemoteDataStatus } from './enums'
import { Progress } from './Progress'

export interface RefreshingFailure<A> {
  readonly status: RemoteDataStatus.RefreshingFailure
  readonly value: A
  readonly progress: Option<Progress>
}

export namespace RefreshingFailure {
  export const of = <A>(value: A, progress?: Progress): RefreshingFailure<A> => ({
    status: RemoteDataStatus.RefreshingFailure,
    value,
    progress: fromNullable(progress),
  })
}

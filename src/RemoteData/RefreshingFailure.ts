import { fromNullable, Option } from 'fp-ts/Option'

import { RemoteDataStatus } from './enums'
import { Progress } from './Progress'

/**
 * A RemoteData state in which the previous request failure with some failure A,
 * but we are currently attempting to load a new response.
 */
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

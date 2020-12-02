import { fromNullable, Option } from 'fp-ts/Option'

import { RemoteDataStatus } from './enums'
import { Progress } from './Progress'

/**
 * A RemoteData state in which the previous request succeeded with some value A,
 * but we are currently attempting to load a new response.
 */
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

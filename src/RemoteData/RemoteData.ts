import { Either, fold } from 'fp-ts/es6/Either'
import { none, Option, some } from 'fp-ts/es6/Option'

import { RemoteDataStatus } from './enums'
import { Failure } from './Failure'
import { Progress } from './Progress'
import { RefreshingFailure } from './RefreshingFailure'
import { RefreshingSuccess } from './RefreshingSuccess'
import { Success } from './Success'

export type RemoteData<A = unknown, B = unknown> =
  | NoData
  | Loading
  | Loaded<A, B>
  | Refreshing<A, B>

export type Loadable<A = unknown, B = unknown> = Exclude<RemoteData<A, B>, NoData>

export type Loaded<A = unknown, B = unknown> = Failure<A> | Success<B>

export type Refreshing<A = unknown, B = unknown> = RefreshingFailure<A> | RefreshingSuccess<B>

export type NoData = {
  readonly status: RemoteDataStatus.NoData
}

export const NoData: NoData = { status: RemoteDataStatus.NoData }

export type Loading = {
  readonly status: RemoteDataStatus.Loading
  readonly progress: Option<Progress>
}
export const Loading: Loading = { status: RemoteDataStatus.Loading, progress: none }

export const progress = (progress: Progress): Loading => ({
  status: RemoteDataStatus.Loading,
  progress: some(progress),
})

export const fromEither = <A, B>(either: Either<A, B>): Loaded<A, B> =>
  fold<A, B, Loaded<A, B>>(Failure.of, Success.of)(either)

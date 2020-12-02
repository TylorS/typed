import { Either, fold } from 'fp-ts/Either'
import { none, Option, some } from 'fp-ts/Option'

import { RemoteDataStatus } from './enums'
import { Failure } from './Failure'
import { Progress } from './Progress'
import { RefreshingFailure } from './RefreshingFailure'
import { RefreshingSuccess } from './RefreshingSuccess'
import { Success } from './Success'

/**
 * A data structure to represent all of the states possible for loading a remote
 * piece of data.
 */
export type RemoteData<A = unknown, B = unknown> =
  | NoData
  | Loading
  | Loaded<A, B>
  | Refreshing<A, B>

/**
 * Loaded states of RemoteData
 */
export type Loaded<A = unknown, B = unknown> = Failure<A> | Success<B>

/**
 * Refreshing states of RemoteData
 */
export type Refreshing<A = unknown, B = unknown> = RefreshingFailure<A> | RefreshingSuccess<B>

/**
 * NoData state
 */
export type NoData = {
  readonly status: RemoteDataStatus.NoData
}

/**
 * NoData singleton
 */
export const NoData: NoData = { status: RemoteDataStatus.NoData }

/**
 * Loading state of RemoteData with optional Progress status
 */
export type Loading = {
  readonly status: RemoteDataStatus.Loading
  readonly progress: Option<Progress>
}

/**
 * Loading singleton
 */
export const Loading: Loading = { status: RemoteDataStatus.Loading, progress: none }

/**
 * Construct Loading states with Progress
 */
export const progress = (progress: Progress): Loading => ({
  status: RemoteDataStatus.Loading,
  progress: some(progress),
})

/**
 * Create a Loaded<A, B> from an Either<A, B>
 */
export const fromEither = <A, B>(either: Either<A, B>): Loaded<A, B> =>
  fold<A, B, Loaded<A, B>>(Failure.of, Success.of)(either)

import { curry } from '@typed/fp/lambda/exports'
import { none, Option } from 'fp-ts/Option'

import { hasNoData } from './hasNoData'
import { isFailure } from './isFailure'
import { isLoading } from './isLoading'
import { isRefreshingFailure } from './isRefreshingFailure'
import { isRefreshingSuccess } from './isRefreshingSuccess'
import { Progress } from './Progress'
import { RemoteData } from './RemoteData'

export type FailureInfo = {
  readonly refreshing: boolean
  readonly progress: Option<Progress>
}

export type SuccessInfo = {
  readonly refreshing: boolean
  readonly progress: Option<Progress>
}

export const fold = curry(__foldRemoteData) as {
  <R1, R2, A, R3, B, R4>(
    noData: () => R1,
    loading: (progress: Option<Progress>) => R2,
    failure: (value: A, info: FailureInfo) => R3,
    success: (value: B, info: SuccessInfo) => R4,
    remoteData: RemoteData<A, B>,
  ): R1 | R2 | R3 | R4

  <R1, R2, A, R3, B, R4>(
    noData: () => R1,
    loading: (progress: Option<Progress>) => R2,
    failure: (value: A, info: FailureInfo) => R3,
    success: (value: B, info: SuccessInfo) => R4,
  ): (remoteData: RemoteData<A, B>) => R1 | R2 | R3 | R4

  <R1, R2, A, R3>(
    noData: () => R1,
    loading: (progress: Option<Progress>) => R2,
    failure: (value: A, info: FailureInfo) => R3,
  ): {
    <B, R4>(success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData<A, B>):
      | R1
      | R2
      | R3
      | R4

    <B, R4>(success: (value: B, info: SuccessInfo) => R4): (
      remoteData: RemoteData<A, B>,
    ) => R1 | R2 | R3 | R4
  }

  <R1, R2>(noData: () => R1, loading: (progress: Option<Progress>) => R2): {
    <A, R3, B, R4>(
      failure: (value: A, info: FailureInfo) => R3,
      success: (value: B, info: SuccessInfo) => R4,
      remoteData: RemoteData<A, B>,
    ): R1 | R2 | R3 | R4

    <A, R3, B, R4>(
      failure: (value: A, info: FailureInfo) => R3,
      success: (value: B, info: SuccessInfo) => R4,
    ): (remoteData: RemoteData<A, B>) => R1 | R2 | R3 | R4

    <A, R3>(failure: (value: A, info: FailureInfo) => R3): {
      <B, R4>(success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData<A, B>):
        | R1
        | R2
        | R3
        | R4

      <B, R4>(success: (value: B, info: SuccessInfo) => R4): (
        remoteData: RemoteData<A, B>,
      ) => R1 | R2 | R3 | R4
    }
  }

  <R1>(noData: () => R1): {
    <R2, A, R3, B, R4>(
      loading: (progress: Option<Progress>) => R2,
      failure: (value: A, info: FailureInfo) => R3,
      success: (value: B, info: SuccessInfo) => R4,
      remoteData: RemoteData<A, B>,
    ): R1 | R2 | R3 | R4

    <R2, A, R3, B, R4>(
      loading: (progress: Option<Progress>) => R2,
      failure: (value: A, info: FailureInfo) => R3,
      success: (value: B, info: SuccessInfo) => R4,
    ): (remoteData: RemoteData<A, B>) => R1 | R2 | R3 | R4

    <R2, A, R3>(
      loading: (progress: Option<Progress>) => R2,
      failure: (value: A, info: FailureInfo) => R3,
    ): {
      <B, R4>(success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData<A, B>):
        | R1
        | R2
        | R3
        | R4

      <B, R4>(success: (value: B, info: SuccessInfo) => R4): (
        remoteData: RemoteData<A, B>,
      ) => R1 | R2 | R3 | R4
    }

    <R2>(loading: (progress: Option<Progress>) => R2): {
      <A, R3, B, R4>(
        failure: (value: A, info: FailureInfo) => R3,
        success: (value: B, info: SuccessInfo) => R4,
        remoteData: RemoteData<A, B>,
      ): R1 | R2 | R3 | R4

      <A, R3, B, R4>(
        failure: (value: A, info: FailureInfo) => R3,
        success: (value: B, info: SuccessInfo) => R4,
      ): (remoteData: RemoteData<A, B>) => R1 | R2 | R3 | R4

      <A, R3>(failure: (value: A, info: FailureInfo) => R3): {
        <B, R4>(success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData<A, B>):
          | R1
          | R2
          | R3
          | R4

        <B, R4>(success: (value: B, info: SuccessInfo) => R4): (
          remoteData: RemoteData<A, B>,
        ) => R1 | R2 | R3 | R4
      }
    }
  }
}

function __foldRemoteData<A, B, C>(
  noData: () => C,
  loading: (progress: Option<Progress>) => C,
  failure: (value: A, info: FailureInfo) => C,
  success: (value: B, info: SuccessInfo) => C,
  remoteData: RemoteData<A, B>,
): C {
  if (hasNoData(remoteData)) {
    return noData()
  }

  if (isLoading(remoteData)) {
    return loading(remoteData.progress)
  }

  if (isFailure(remoteData)) {
    return failure(remoteData.value, { refreshing: false, progress: none })
  }

  if (isRefreshingFailure(remoteData)) {
    return failure(remoteData.value, { refreshing: true, progress: remoteData.progress })
  }

  if (isRefreshingSuccess(remoteData)) {
    return success(remoteData.value, { refreshing: true, progress: remoteData.progress })
  }

  return success(remoteData.value, { refreshing: false, progress: none })
}

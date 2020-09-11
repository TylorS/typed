import { deepEqualsEq } from '@typed/fp/common/exports'
import { Eq } from 'fp-ts/Eq'

import { hasNoData } from './hasNoData'
import { isFailure } from './isFailure'
import { isLoading } from './isLoading'
import { isRefreshingFailure } from './isRefreshingFailure'
import { isSuccess } from './isSuccess'
import { RemoteData } from './RemoteData'

export const getEq = <A, B>(left: Eq<A>, right: Eq<B>): Eq<RemoteData<A, B>> => ({
  equals: (a, b) => {
    if (a.status !== b.status) {
      return false
    }

    if (hasNoData(a)) {
      return true
    }
    if (isLoading(a)) {
      return deepEqualsEq.equals(a.progress, (b as typeof a).progress)
    }

    if (isSuccess(a)) {
      return right.equals(a.value, (b as typeof a).value)
    }

    if (isFailure(a)) {
      return left.equals(a.value, (b as typeof a).value)
    }

    if (isRefreshingFailure(a)) {
      return (
        left.equals(a.value, (b as typeof a).value) &&
        deepEqualsEq.equals(a.progress, (b as typeof a).progress)
      )
    }

    return (
      right.equals(a.value, (b as typeof a).value) &&
      deepEqualsEq.equals(a.progress, (b as typeof a).progress)
    )
  },
})

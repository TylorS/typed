import { curry } from '@typed/fp/lambda/exports'
import { Lazy } from 'fp-ts/es6/function'

import { isRefreshingSuccess } from './isRefreshingSuccess'
import { isSuccess } from './isSuccess'
import { RemoteData } from './RemoteData'

export const getOrElse = curry(<A, B, C>(ioa: Lazy<A>, rd: RemoteData<B, C>): A | C =>
  isSuccess(rd) || isRefreshingSuccess(rd) ? rd.value : ioa(),
) as {
  <A, B, C>(ioa: Lazy<A>, rd: RemoteData<B, C>): A | C
  <A>(ioa: Lazy<A>): <B, C>(rd: RemoteData<B, C>) => A | C
}

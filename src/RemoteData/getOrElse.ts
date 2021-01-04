import { curry } from '@fp/lambda/exports'
import { Lazy } from 'fp-ts/function'

import { isSuccessful } from './isSuccessful'
import { RemoteData } from './RemoteData'

/**
 * Get the value contained within a successful RemoteData or return the lazy value.
 */
export const getOrElse = curry(<A, B, C>(ioa: Lazy<A>, rd: RemoteData<B, C>): A | C =>
  isSuccessful(rd) ? rd.value : ioa(),
) as {
  <A, B, C>(ioa: Lazy<A>, rd: RemoteData<B, C>): A | C
  <A>(ioa: Lazy<A>): <B, C>(rd: RemoteData<B, C>) => A | C
}

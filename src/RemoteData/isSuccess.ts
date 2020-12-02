import { RemoteDataStatus } from './enums'
import { RemoteData } from './RemoteData'
import { Success } from './Success'

/**
 * Check if RemoteData is a Success
 */
export const isSuccess = <A, B>(remoteData: RemoteData<A, B>): remoteData is Success<B> =>
  remoteData.status === RemoteDataStatus.Success

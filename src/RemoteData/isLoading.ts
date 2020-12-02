import { RemoteDataStatus } from './enums'
import { Loading, RemoteData } from './RemoteData'

/**
 * Check if a RemoteData is Loading
 */
export const isLoading = <A, B>(remoteData: RemoteData<A, B>): remoteData is Loading =>
  remoteData.status === RemoteDataStatus.Loading

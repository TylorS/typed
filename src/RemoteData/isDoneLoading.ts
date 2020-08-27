import { isFailure } from './isFailure'
import { isSuccess } from './isSuccess'
import { Loaded, RemoteData } from './RemoteData'

export const isDoneLoading = <A, B>(remoteData: RemoteData<A, B>): remoteData is Loaded<A, B> =>
  isSuccess(remoteData) || isFailure(remoteData)

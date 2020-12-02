/**
 * All of the statuses RemoteData can be in
 */
export enum RemoteDataStatus {
  NoData = 'no-data',
  Loading = 'loading',
  Failure = 'failure',
  Success = 'success',
  RefreshingFailure = 'refreshing-failure',
  RefreshingSuccess = 'refreshing-success',
}

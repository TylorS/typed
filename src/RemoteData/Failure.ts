import { RemoteDataStatus } from './enums'

export interface Failure<A> {
  readonly status: RemoteDataStatus.Failure
  readonly value: A
}

export namespace Failure {
  export const of = <A>(value: A): Failure<A> => ({ status: RemoteDataStatus.Failure, value })
}

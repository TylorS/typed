import { FailEnv } from '@typed/fp/Effect'

export const JsonRpcFailure = Symbol('JsonRpcFailure')
export interface JsonRpcFailure extends FailEnv<typeof JsonRpcFailure, Error> {}

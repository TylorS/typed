import { FunctionN } from 'fp-ts/function'

export type ArgsOf<A> = A extends FunctionN<infer R, any> ? R : never

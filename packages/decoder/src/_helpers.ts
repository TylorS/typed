import * as ParseResult from '@effect/schema/ParseResult'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IOError<T> = T extends ParseResult.IO<infer E, infer _> ? E : never
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IOOutput<T> = T extends ParseResult.IO<infer _, infer A> ? A : never

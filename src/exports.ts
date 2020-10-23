export * as A from 'fp-ts/Array'
export * as E from 'fp-ts/Either'
export * as Eq from 'fp-ts/Eq'
export * as IO from 'fp-ts/IO'
export * as NEA from 'fp-ts/NonEmptyArray'
export * as O from 'fp-ts/Option'
export * as R from 'fp-ts/Reader'
export * as RE from 'fp-ts/ReaderEither'
export * as RT from 'fp-ts/ReaderTask'
export * as RTE from 'fp-ts/ReaderTaskEither'
export * as RAA from 'fp-ts/ReadonlyArray'
export * as RM from 'fp-ts/ReadonlyMap'
export * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
export * as RR from 'fp-ts/ReadonlyRecord'
export * as RS from 'fp-ts/ReadonlySet'
export * as T from 'fp-ts/Task'
export * as TE from 'fp-ts/TaskEither'

// Instances
export { effect, effectSeq } from './Effect/exports'
export { future, futureSeq } from './Future/exports'
export { stream } from './Stream/exports'

// New types

export type { Key, UuidKey } from './Key/exports'
export type { Path } from './Path/exports'
export type { Uri } from './Uri/exports'
export type { Uuid } from './Uuid/exports'

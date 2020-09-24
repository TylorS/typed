import * as E from 'fp-ts/Either'
import * as Eq from 'fp-ts/Eq'
import * as IO from 'fp-ts/IO'
import * as O from 'fp-ts/Option'
import * as R from 'fp-ts/Reader'
import * as RE from 'fp-ts/ReaderEither'
import * as RT from 'fp-ts/ReaderTask'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as A from 'fp-ts/ReadonlyArray'
import * as RM from 'fp-ts/ReadonlyMap'
import * as NEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as RS from 'fp-ts/ReadonlySet'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'

export { A, E, Eq, IO, NEA, O, R, RE, RM, RR, RT, RTE, RS, T, TE }

// Instances
export { effect, effectSeq } from './Effect/exports'
export { future, futureSeq } from './Future/exports'
export { stream } from './Stream/exports'

// New types

export { Key, UuidKey } from './Key/exports'
export { Path } from './Path/exports'
export { Uri } from './Uri/exports'
export { Uuid } from './Uuid/exports'

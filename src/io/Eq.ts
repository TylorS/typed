import { deepEqualsEq } from '@typed/fp/common/exports'
import * as RD from '@typed/fp/RemoteData/exports'
import * as E from 'fp-ts/Either'
import { eqDate, eqNumber, eqStrict } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'
import * as RS from 'fp-ts/ReadonlySet'
import * as Eq from 'io-ts/es6/Eq'

import { TypedSchemable1 } from './TypedSchemable'

export const Schemable: TypedSchemable1<Eq.URI> = {
  ...Eq.Schemable,
  ...Eq.WithRefine,
  set: RS.getEq,
  map: RM.getEq,
  option: O.getEq,
  either: E.getEq,
  remoteData: RD.getEq,
  date: eqDate,
  uuid: eqStrict,
  int: eqNumber,
  bigint: eqStrict,
  unknown: eqStrict,
  never: eqStrict,
  json: deepEqualsEq,
  jsonArray: deepEqualsEq,
  jsonPrimitive: deepEqualsEq,
  jsonRecord: deepEqualsEq,
  union: (...eqs) => ({
    equals: (a, b) => eqs.some((e) => e.equals(a, b)),
  }),
  newtype: (from, refine, id) => Schemable.refine(refine, id)(from),
}

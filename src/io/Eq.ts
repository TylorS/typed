import { deepEqualsEq } from '@typed/fp/common/exports'
import * as RD from '@typed/fp/RemoteData/exports'
import * as E from 'fp-ts/Either'
import { Eq, eqDate, eqNumber, eqStrict } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'
import * as RS from 'fp-ts/ReadonlySet'
import * as EqI from 'io-ts/Eq'

import { TypedSchemable1 } from './TypedSchemable'

export const Schemable: TypedSchemable1<EqI.URI> = {
  ...EqI.Schemable,
  refine: (refinement, id) => EqI.WithRefine.refine(refinement, id),
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
  symbol: eqStrict,
  json: deepEqualsEq,
  jsonArray: deepEqualsEq,
  jsonPrimitive: deepEqualsEq,
  jsonRecord: deepEqualsEq,
  union: (...eqs) => ({
    equals: (a, b) => eqs.some(tryEq(a, b)),
  }),
  newtype: (from, refine, id) => Schemable.refine(refine, id)(from),
}

function tryEq<A>(a: A, b: A) {
  return (eq: Eq<A>) => {
    try {
      return eq.equals(a, b)
    } catch {
      return false
    }
  }
}

import { deepEqualsEq } from '@typed/fp/common/exports'
import { Match } from '@typed/fp/logic/types'
import * as RD from '@typed/fp/RemoteData/exports'
import * as E from 'fp-ts/Either'
import { Eq, eqDate, eqNumber, eqStrict } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { isSome } from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'
import * as RS from 'fp-ts/ReadonlySet'
import * as EqI from 'io-ts/Eq'
import { AnyNewtype, CarrierOf } from 'newtype-ts'

import { TypedSchemable1 } from './TypedSchemable'

/**
 * A TypedSchemable instance for Eqs
 */
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
  propertyKey: eqStrict,
  json: deepEqualsEq,
  jsonArray: deepEqualsEq,
  jsonPrimitive: deepEqualsEq,
  jsonRecord: deepEqualsEq,
  union: (...eqs) => ({
    equals: (a, b) => eqs.some(tryEq(a, b)),
  }),
  newtype: <A extends AnyNewtype>(
    from: Eq<CarrierOf<A>>,
    refine: Match<CarrierOf<A>, A>,
    id: string,
  ) => Schemable.refine((a): a is A => isSome(refine(a)), id)(from),
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

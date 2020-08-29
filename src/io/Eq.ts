import * as RD from '@typed/fp/RemoteData'
import * as E from 'fp-ts/es6/Either'
import { eqDate, eqNumber, eqStrict } from 'fp-ts/es6/Eq'
import * as O from 'fp-ts/es6/Option'
import * as RM from 'fp-ts/es6/ReadonlyMap'
import * as RS from 'fp-ts/es6/ReadonlySet'
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
  union: (...eqs) => ({
    equals: (a, b) => eqs.some((e) => e.equals(a, b)),
  }),
  newtype: (from, refine, id) => Schemable.refine(refine, id)(from),
}

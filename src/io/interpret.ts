import { HKT, Kind, Kind2, URIS, URIS2 } from 'fp-ts/es6/HKT'
import { Schema } from 'io-ts/es6/Schema'
import { Schemable, Schemable1, Schemable2C } from 'io-ts/es6/Schemable'

export function interpret<S extends URIS2, A, B>(
  schemable: Schemable2C<S, A>,
  schema: Schema<B>,
): Kind2<S, A, B>

export function interpret<S extends URIS, A>(
  schemable: Schemable1<S>,
  schema: Schema<A>,
): Kind<S, A>

export function interpret<S, A>(schemable: Schemable<S>, schema: Schema<A>): HKT<S, A>

export function interpret<S, A>(schemable: Schemable<S>, schema: Schema<A>) {
  return schema(schemable)
}

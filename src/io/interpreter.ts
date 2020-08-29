import { curry } from '@typed/fp/lambda'
import { HKT, Kind, Kind2 } from 'fp-ts/es6/HKT'
import { Schema } from 'io-ts/es6/Schema'
import { Schemable, Schemable1, Schemable2C } from 'io-ts/es6/Schemable'

export const interpreter = curry(function <S, A>(
  schemable: Schemable<S>,
  schema: Schema<A>,
): HKT<S, A> {
  return schema(schemable)
}) as {
  <S extends Schemable2C<any, any>, A>(schemable: S, schema: Schema<A>): Kind2<
    S['URI'],
    Schemable2CE<S>,
    A
  >
  <S extends Schemable2C<any, any>>(schemable: S): <A>(
    schema: Schema<A>,
  ) => Kind2<S['URI'], Schemable2CE<S>, A>

  <S extends Schemable1<any>, A>(schemable: S, schema: Schema<A>): Kind<S['URI'], A>
  <S extends Schemable1<any>>(schemable: S): <A>(schema: Schema<A>) => Kind<S['URI'], A>
}

export type Schemable2CE<S> = S extends Schemable2C<any, infer E> ? E : never

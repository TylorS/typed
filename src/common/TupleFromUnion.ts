import { pipe } from 'fp-ts/function'
import { contramap, Ord, ordNumber } from 'fp-ts/Ord'

/**
 * Converts a Union of keys into a union of Tuples representing all possible combinations.
 * @example
 * TupleFromUnion<1 | 2 | 3> === readonly [1, 2, 3]
 *  | readonly [1, 3, 2]
 *  | readonly [2, 1, 3]
 *  | readonly [2, 3, 1]
 *  | readonly [3, 1, 2]
 *  | readonly [3, 2, 1]
 */
export type TupleFromUnion<U extends PropertyKey, R extends readonly PropertyKey[] = []> = {
  readonly [S in U]: Exclude<U, S> extends never
    ? readonly [...R, S]
    : TupleFromUnion<Exclude<U, S>, readonly [...R, S]>
}[U]

/**
 * Create an Ord instance from a union of string | number | symbol. This requires a valid
 * combination of all members of that union to construct an ordering for values of that union.
 */
export function ordFromUnion<U extends PropertyKey>(...ordering: TupleFromUnion<U>): Ord<U> {
  return pipe(
    ordNumber,
    contramap((u) =>
      (ordering as readonly U[]) /* This cast avoids "excessively deep type errors" */
        .indexOf(u),
    ),
  )
}

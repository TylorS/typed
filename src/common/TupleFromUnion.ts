import { pipe } from 'fp-ts/function'
import { contramap, Ord, ordNumber } from 'fp-ts/Ord'

export type TupleFromUnion<U extends PropertyKey, R extends readonly PropertyKey[] = []> = {
  readonly [S in U]: Exclude<U, S> extends never
    ? readonly [...R, S]
    : TupleFromUnion<Exclude<U, S>, readonly [...R, S]>
}[U]

/**
 * Create an Ord instance from a union
 */
export function ordFromUnion<U extends PropertyKey>(...ordering: TupleFromUnion<U>): Ord<U> {
  return pipe(
    ordNumber,
    contramap((u) => (ordering as readonly U[]).indexOf(u)),
  )
}

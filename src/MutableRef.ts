/**
 * MutableRef
 *
 * @since 0.14.2
 */
import { pipe } from 'fp-ts/function'

import * as E from './Env'
import * as Ref from './Ref'

/**
 * @since 0.14.2
 * @category Model
 */
export interface MutableRef<E, A>
  extends Ref.Ref<
    E,
    {
      current: A
    }
  > {}

/**
 * @since 0.14.2
 * @category Constructor
 */
export function current<A>(): { current: A | undefined }
export function current<A>(current: A): { current: A }

export function current<A = undefined>(current?: A): { current: typeof current } {
  return {
    current,
  }
}

/**
 * @since 0.14.2
 * @category Combinator
 */
export function get<E, A>(ref: MutableRef<E, A>): E.Env<E, A> {
  return pipe(
    ref.get,
    E.map((x) => x.current),
  )
}

/**
 * @since 0.14.2
 * @category Combinator
 */
export function set<A>(value: A) {
  return <E>(ref: MutableRef<E, A>): E.Env<E, { current: A }> => {
    return pipe(
      ref.update((r) =>
        E.fromIO(() => {
          r.current = value
          return r
        }),
      ),
    )
  }
}

/**
 * @since 0.14.2
 * @category Combinator
 */
export function update<A, E1>(f: (value: A) => E.Env<E1, A>) {
  return <E2>(ref: MutableRef<E2, A>): E.Env<E1 & E2, { current: A }> => {
    return pipe(
      ref.update((r) =>
        pipe(
          f(r.current),
          E.map((value) => {
            r.current = value

            return r
          }),
        ),
      ),
    )
  }
}

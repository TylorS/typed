import { flow, pipe } from 'fp-ts/function'

import * as D from './Data'
import * as E from './Env'
import * as O from './Option'
import { Progress } from './Progress'
import * as Ref from './Ref'

/**
 * @since 0.12.1
 * @category Model
 */
export interface RefData<E, A> extends Ref.Ref<E, D.Data<A>> {}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function toNoData<E, A>(rd: RefData<E, A>) {
  return rd.update(() => E.of(D.noData))
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function toLoading<E, A>(rd: RefData<E, A>) {
  return rd.update(flow(D.toLoading, E.of))
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function toRefresh<A>(value: A, progress?: O.Option<Progress>) {
  return <E>(rd: RefData<E, A>) => rd.update(() => E.of(D.refresh(value, progress)))
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function toReplete<A>(value: A) {
  return <E>(rd: RefData<E, A>) => rd.update(() => E.of(D.replete(value)))
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function loadEnv<E1, A>(env: E.Env<E1, A>) {
  return <E2>(rd: RefData<E2, A>) =>
    pipe(
      rd,
      toLoading,
      E.chainW(() => rd.update(() => pipe(env, E.map(D.replete)))),
    )
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export const map =
  <A, B>(f: (value: A) => B) =>
  <E>(ref: RefData<E, A>): Ref.Ref<E, D.Data<A>, D.Data<B>> =>
    pipe(ref, Ref.map(D.map(f)))

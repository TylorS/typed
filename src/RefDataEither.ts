/**
 * RefDataEither is a collection of helpers for working with Refs that manage DataEither.
 * @since 0.12.1
 */
import { flow, pipe } from 'fp-ts/function'

import * as DE from './DataEither'
import * as E from './Env'
import * as EE from './EnvEither'
import * as O from './Option'
import { Progress } from './Progress'
import * as Ref from './Ref'

/**
 * @since 0.12.1
 * @category Model
 */
export interface RefDataEither<R, E, A> extends Ref.Ref<R, DE.DataEither<E, A>> {}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function toNoData<R, E, A>(rd: RefDataEither<R, E, A>) {
  return rd.update(() => E.of(DE.noData))
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function toLoading<R, E, A>(rd: RefDataEither<R, E, A>) {
  return rd.update(flow(DE.toLoading, E.of))
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function toRefresh<A>(value: A, progress?: O.Option<Progress>) {
  return <R, E>(rd: RefDataEither<R, E, A>) => rd.update(() => E.of(DE.refresh(value, progress)))
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function toReplete<A>(value: A) {
  return <R, E>(rd: RefDataEither<R, E, A>) => rd.update(() => E.of(DE.replete(value)))
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function loadEnv<E1, A>(env: E.Env<E1, A>) {
  return <R, E2>(rd: RefDataEither<R, E2, A>) =>
    pipe(
      rd,
      toLoading,
      E.chainW(() => rd.update(() => pipe(env, E.map(DE.replete)))),
    )
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export function loadEnvEither<R1, E, A>(env: EE.EnvEither<R1, E, A>) {
  return <R2>(rd: RefDataEither<R2, E, A>) =>
    pipe(
      rd,
      toLoading,
      E.chainW(() => rd.update(() => pipe(env, E.map(DE.fromEither)))),
    )
}

/**
 * @since 0.12.1
 * @category Combinator
 */
export const map =
  <A, B>(f: (value: A) => B) =>
  <R, E>(ref: RefDataEither<R, E, A>): Ref.Ref<R, DE.DataEither<E, A>, DE.DataEither<E, B>> =>
    pipe(ref, Ref.map(DE.map(f)))

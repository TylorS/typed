import { Chain, Chain2, Chain3, Chain4 } from 'fp-ts/Chain'
import { Eq } from 'fp-ts/Eq'
import { FromReader, FromReader2, FromReader3, FromReader4 } from 'fp-ts/FromReader'
import { identity, pipe } from 'fp-ts/function'
import { HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import { Option } from 'fp-ts/Option'
import { L } from 'ts-toolbelt'

import { Branded } from '../Branded'
import * as E from '../Env'
import { deepEqualsEq } from '../Eq'
import { FromEnv, FromEnv2, FromEnv3, FromEnv4 } from '../FromEnv'
import { Hkt } from '../Hkt'

export interface Ref<F, Params extends readonly any[]> {
  readonly id: RefId
  readonly initial: Hkt<F, Params>
  readonly eq: Eq<L.Last<Params>>
}

export function createRef<F extends URIS2>(): <E, A>(
  initial: Hkt<F, [E, A]>,
  id?: RefId,
  eq?: Eq<A>,
) => Ref2<F, E, A>

export function createRef<F extends URIS3>(): <R, E, A>(
  initial: Hkt<F, [R, E, A]>,
  id?: PropertyKey,
  eq?: Eq<A>,
) => Ref3<F, R, E, A>

export function createRef<F extends URIS4>(): <S, R, E, A>(
  initial: Hkt<F, [S, R, E, A]>,
  id?: PropertyKey,
  eq?: Eq<A>,
) => Ref4<F, S, R, E, A>

export function createRef<F>(): <E, A>(
  initial: HKT2<F, E, A>,
  id?: PropertyKey,
  eq?: Eq<A>,
) => Ref<F, [E, A]>

export function createRef<F>() {
  return <Params extends readonly any[]>(
    initial: Hkt<F, Params>,
    id: PropertyKey = Symbol(),
    eq: Eq<L.Last<Params>> = deepEqualsEq,
  ): Ref<F, Params> => {
    return {
      id: FiberRefId(id),
      initial,
      eq,
    }
  }
}

export interface Ref2<F extends URIS2, E, A> extends Ref<F, [E, A]> {}
export interface Ref3<F extends URIS3, R, E, A> extends Ref<F, [R, E, A]> {}
export interface Ref4<F extends URIS4, S, R, E, A> extends Ref<F, [S, R, E, A]> {}

export type RefId = Branded<{ readonly RefId: unique symbol }, PropertyKey>
export const FiberRefId = Branded<RefId>()

export interface References<F, R> {
  readonly getRef: <E, A>(ref: Ref<F, [E, A]>) => HKT2<F, R & E, A>
  readonly setRef: <A>(value: A) => <E>(ref: Ref<F, [E, A]>) => HKT2<F, R & E, A>
  readonly deleteRef: <E, A>(ref: Ref<F, [E, A]>) => HKT2<F, R, Option<A>>
}

export interface References2<F extends URIS2, R> {
  readonly getRef: <E, A>(ref: Ref<F, [E, A]>) => Hkt<F, [R & E, A]>
  readonly setRef: <A>(value: A) => <E>(ref: Ref<F, [E, A]>) => Hkt<F, [R & E, A]>
  readonly deleteRef: <E, A>(ref: Ref<F, [E, A]>) => Hkt<F, [R, Option<A>]>
}

export interface References3<F extends URIS3, R1> {
  readonly getRef: <R, E, A>(ref: Ref<F, [R, E, A]>) => Hkt<F, [R1 & R, E, A]>
  readonly setRef: <A>(value: A) => <R, E>(ref: Ref<F, [R, E, A]>) => Hkt<F, [R1 & R, E, A]>
  readonly deleteRef: <R, E, A>(ref: Ref<F, [R, E, A]>) => Hkt<F, [R1, E, Option<A>]>
}

export interface References4<F extends URIS4, R1> {
  readonly getRef: <S, R, E, A>(ref: Ref<F, [S, R, E, A]>) => Hkt<F, [S, R1 & R, E, A]>
  readonly setRef: <A>(
    value: A,
  ) => <S, R, E>(ref: Ref<F, [S, R, E, A]>) => Hkt<F, [S, R1 & R, E, A]>
  readonly deleteRef: <S, R, E, A>(ref: Ref<F, [S, R, E, A]>) => Hkt<F, [S, R1, E, Option<A>]>
}

export type Refs<F, R = unknown> = {
  readonly refs: References<F, R>
}

export type Refs2<F extends URIS2, R = unknown> = {
  readonly refs: References2<F, R>
}

export type Refs3<F extends URIS3, R = unknown> = {
  readonly refs: References3<F, R>
}

export type Refs4<F extends URIS4, R = unknown> = {
  readonly refs: References4<F, R>
}

export function getRef<F extends URIS2>(
  M: FromEnv2<F> & Chain2<F>,
): <E, A>(ref: Ref2<F, E, A>) => Hkt<F, [E & Refs2<F, unknown>, A]>
export function getRef<F extends URIS3>(
  M: FromEnv3<F> & Chain3<F>,
): <R, E, A>(ref: Ref3<F, R, E, A>) => Hkt<F, [R & Refs3<F, unknown>, E, A]>
export function getRef<F extends URIS4>(
  M: FromEnv4<F> & Chain4<F>,
): <S, R, E, A>(ref: Ref4<F, S, R, E, A>) => Hkt<F, [S, R & Refs4<F, unknown>, E, A]>
export function getRef<F>(
  M: FromEnv<F> & Chain<F>,
): <E, A>(ref: Ref<F, [E, A]>) => HKT2<F, E & Refs<F, unknown>, A>
export function getRef<F>(M: FromEnv<F> & Chain<F>) {
  return <E, A>(ref: Ref<F, [E, A]>) =>
    pipe(M.fromEnv(E.asks((e: Refs<F, unknown>) => e.refs.getRef(ref))), M.chain(identity))
}

export function setRef<F extends URIS2>(
  M: FromEnv2<F> & Chain2<F>,
): <A>(value: A) => <E>(ref: Ref2<F, E, A>) => Hkt<F, [E & Refs2<F, unknown>, A]>
export function setRef<F extends URIS3>(
  M: FromEnv3<F> & Chain3<F>,
): <A>(value: A) => <R, E>(ref: Ref3<F, R, E, A>) => Hkt<F, [R & Refs3<F, unknown>, E, A]>
export function setRef<F extends URIS4>(
  M: FromEnv4<F> & Chain4<F>,
): <A>(value: A) => <S, R, E>(ref: Ref4<F, S, R, E, A>) => Hkt<F, [S, R & Refs4<F, unknown>, E, A]>
export function setRef<F>(
  M: FromEnv<F> & Chain<F>,
): <A>(value: A) => <E>(ref: Ref<F, [E, A]>) => HKT2<F, E & Refs<F, unknown>, A>
export function setRef<F>(M: FromEnv<F> & Chain<F>) {
  return <A>(value: A) => <E>(ref: Ref<F, [E, A]>) =>
    pipe(
      M.fromEnv(E.asks((e: Refs<F, unknown>) => pipe(ref, e.refs.setRef(value)))),
      M.chain(identity),
    )
}

export function deleteRef<F extends URIS2>(
  M: FromEnv2<F> & Chain2<F>,
): <E, A>(ref: Ref2<F, E, A>) => Hkt<F, [Refs2<F, unknown>, Option<A>]>
export function deleteRef<F extends URIS3>(
  M: FromEnv3<F> & Chain3<F>,
): <R, E, A>(ref: Ref3<F, R, E, A>) => Hkt<F, [Refs3<F, unknown>, E, Option<A>]>
export function deleteRef<F extends URIS4>(
  M: FromEnv4<F> & Chain4<F>,
): <S, R, E, A>(ref: Ref4<F, S, R, E, A>) => Hkt<F, [S, Refs4<F, unknown>, E, Option<A>]>
export function deleteRef<F>(
  M: FromEnv<F> & Chain<F>,
): <E, A>(ref: Ref<F, [E, A]>) => HKT2<F, Refs<F, unknown>, Option<A>>
export function deleteRef<F>(M: FromEnv<F> & Chain<F>) {
  return <E, A>(ref: Ref<F, [E, A]>) =>
    pipe(M.fromEnv(E.asks((e: Refs<F, unknown>) => e.refs.deleteRef(ref))), M.chain(identity))
}

export function fromKey<F extends URIS2>(
  M: FromReader2<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Ref2<F, Readonly<Record<K, A>>, A>

export function fromKey<F extends URIS3, E = unknown>(
  M: FromReader3<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Ref3<F, Readonly<Record<K, A>>, E, A>

export function fromKey<F extends URIS4, S = unknown, E = unknown>(
  M: FromReader4<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Ref4<F, S, Readonly<Record<K, A>>, E, A>

export function fromKey<F>(
  M: FromReader<F>,
): <A>(eq?: Eq<A>) => <K extends PropertyKey>(key: K) => Ref<F, [Readonly<Record<K, A>>, A]>

export function fromKey<F>(M: FromReader<F>) {
  const create = createRef<F>()

  return <A>(eq: Eq<A> = deepEqualsEq) => <K extends PropertyKey>(key: K) =>
    create(
      M.fromReader((e: Readonly<Record<K, A>>) => e[key]),
      FiberRefId(key),
      eq,
    )
}

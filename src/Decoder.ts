import * as C from 'fp-ts/Const'
import * as R from 'fp-ts/Reader'
import { Refinement } from 'fp-ts/Refinement'
import * as TH from 'fp-ts/These'
import { L, U } from 'ts-toolbelt'

import * as DE from './DecodeError'
import { Intersect } from './Hkt'

export type NonEmptyArray<A> = readonly [A, ...A[]]

/**
 * Ast Helper type
 */
export interface Ast<Tag extends PropertyKey, R, I, E, O>
  extends C.Const<{ readonly _tag: Tag }, readonly [R, I, E, O]> {}

export type TagOf<A> = A extends Ast<infer R, any, any, any, any> ? R : unknown
export type RequirementsOf<A> = A extends Ast<any, infer R, any, any, any> ? R : unknown
export type InputOf<A> = A extends Ast<any, any, infer R, any, any> ? R : unknown
export type ErrorOf<A> = A extends Ast<any, any, any, infer R, any> ? R : unknown
export type OutputOf<A> = A extends Ast<any, any, any, any, infer R> ? R : unknown

// Interpreters

/**
 * Standard decode with no information loss
 */
export type Decode<R, I, E, O> = R.Reader<R, (input: I) => TH.These<DE.DecodeError<E>, O>>

/**
 * Standard decoder with full control
 */
export interface DecodeD<R, I, E, O> extends Ast<'identity', R, I, E, O> {
  readonly decode: Decode<R, I, E, O>
}

export const make = <R, I, E, O>(decode: Decode<R, I, E, O>): DecodeD<R, I, E, O> =>
  C.make({ _tag: 'identity', decode })

export interface RefineD<I, E, O extends I>
  extends Ast<
    'refine',
    { readonly refine: <I, E, O extends I>(ast: RefineD<I, E, O>) => Decode<unknown, I, E, O> },
    I,
    E,
    O
  > {
  readonly error: (input: I) => DE.DecodeError<E>
  readonly refinement: Refinement<I, O>
}

export const refine = <I, E, O extends I>(
  error: (input: I) => DE.DecodeError<E>,
  refinement: Refinement<I, O>,
): RefineD<I, E, O> => C.make({ _tag: 'refine', error, refinement })

export interface StringE {
  readonly _tag: 'string'
}
export const StringE: StringE = { _tag: 'string' }
export const stringE = <I>(input: I) => DE.leafE(input, StringE)
export const string = refine(stringE, (x): x is string => typeof x === 'string')

export interface NumberE {
  readonly _tag: 'number'
}
export const NumberE: NumberE = { _tag: 'number' }
export const numberE = <I>(input: I) => DE.leafE(input, NumberE)
export const number = refine(numberE, (x): x is number => typeof x === 'number')

export interface BooleanE {
  readonly _tag: 'boolean'
}
export const BooleanE: BooleanE = { _tag: 'boolean' }
export const booleanE = <I>(input: I) => DE.leafE(input, BooleanE)
export const boolean = refine(booleanE, (x): x is boolean => typeof x === 'boolean')

export interface UnknownRecordE {
  readonly _tag: 'unknownRecord'
}
export const UnknownRecordE: UnknownRecordE = { _tag: 'unknownRecord' }
export const unknownRecordE = <I>(input: I) => DE.leafE(input, UnknownRecordE)
export const unknownRecord = refine(
  unknownRecordE,
  (x): x is Readonly<Record<PropertyKey, unknown>> =>
    !!x && !Array.isArray(x) && typeof x === 'object',
)

export interface UnknownArrayE {
  readonly _tag: 'unknownArray'
}
export const UnknownArrayE: UnknownArrayE = { _tag: 'unknownArray' }
export const unknownArrayE = <I>(input: I) => DE.leafE(input, UnknownArrayE)
export const unknownArray = refine(unknownArrayE, (x): x is ReadonlyArray<unknown> =>
  Array.isArray(x),
)

export interface ComposeD<M extends NonEmptyArray<Ast<any, any, any, any, any>>>
  extends Ast<
    'compose',
    Intersect<{ readonly [K in keyof M]: RequirementsOf<M[K]> }> & {
      readonly compose: <M extends NonEmptyArray<Ast<any, any, any, any, any>>>(
        ast: ComposeD<M>,
      ) => Decode<
        RequirementsOf<ComposeD<M>>,
        InputOf<ComposeD<M>>,
        ErrorOf<ComposeD<M>>,
        OutputOf<ComposeD<M>>
      >
    },
    InputOf<M[0]>,
    ErrorOf<M[number]>,
    OutputOf<L.Last<M>>
  > {}

export const compose = <M extends NonEmptyArray<Ast<any, any, any, any, any>>>(
  ...members: M
): ComposeD<M> => C.make({ _tag: 'compose', members })

export interface UnionD<M extends NonEmptyArray<Ast<any, any, any, any, any>>>
  extends Ast<
    'union',
    Intersect<U.ListOf<RequirementsOf<M[number]>>>,
    InputOf<M[number]>,
    ErrorOf<M[number]>,
    OutputOf<M[number]>
  > {
  readonly members: M
}

export const union = <M extends NonEmptyArray<Ast<any, any, any, any, any>>>(
  ...members: M
): UnionD<M> => C.make({ _tag: 'union', members })

export interface StructD<
  Props extends Readonly<Record<string, Ast<any, unknown, any, any, any>>>
> extends Ast<
    'struct',
    Intersect<U.ListOf<RequirementsOf<Props[keyof Props]>>> & {
      readonly struct: <Props extends Readonly<Record<string, Ast<any, unknown, any, any, any>>>>(
        struct: StructD<Props>,
      ) => Decode<
        RequirementsOf<StructD<Props>>,
        InputOf<StructD<Props>>,
        ErrorOf<StructD<Props>>,
        OutputOf<StructD<Props>>
      >
    },
    Readonly<Record<PropertyKey, unknown>>,
    ErrorOf<Props[keyof Props]>,
    { readonly [K in keyof Props]: OutputOf<Props[K]> }
  > {
  readonly props: Props
}

export type PropsOf<A> = A extends StructD<infer R> ? R : never

export const fromStruct = <Props extends Readonly<Record<string, Ast<any, any, any, any, any>>>>(
  props: Props,
): StructD<Props> => C.make({ _tag: 'struct', props })

export const struct = <Props extends Readonly<Record<string, Ast<any, any, any, any, any>>>>(
  props: Props,
) => compose(unknownRecord, fromStruct(props))

export const intersection = <A extends NonEmptyArray<StructD<any>>>(
  ...structs: A
): StructD<Intersect<U.ListOf<PropsOf<A[number]>>, {}>> =>
  fromStruct(Object.assign({}, ...structs.map((s) => s.props)))

export interface ArrayD<M extends Ast<any, any, any, any, any>>
  extends Ast<
    'array',
    RequirementsOf<M> & {
      readonly array: <M extends Ast<any, any, any, any, any>>(
        ast: ArrayD<M>,
      ) => Decode<
        RequirementsOf<ArrayD<M>>,
        InputOf<ArrayD<M>>,
        ErrorOf<ArrayD<M>>,
        OutputOf<ArrayD<M>>
      >
    },
    ReadonlyArray<InputOf<M>>,
    ErrorOf<M>,
    ReadonlyArray<OutputOf<M>>
  > {
  readonly member: M
}

export const fromArray = <M extends Ast<any, any, any, any, any>>(member: M): ArrayD<M> =>
  C.make({ _tag: 'array', member })

export const array = <M extends Ast<any, any, any, any, any>>(member: M) =>
  compose(unknownArray, fromArray(member))

export interface LazyD<D extends Ast<any, any, any, any, any>>
  extends Ast<'lazy', RequirementsOf<D>, InputOf<D>, ErrorOf<D>, OutputOf<D>> {
  readonly f: () => D
}

export const lazy = <D extends Ast<any, any, any, any, any>>(f: () => D): LazyD<D> =>
  C.make({ _tag: 'lazy', f })

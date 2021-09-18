import { Covariant1, Covariant2, Covariant3, CovariantHkt } from '@/Covariant'
import {
  Hkt,
  HktValue,
  Kind,
  ParamOf,
  TupleToIntersection,
  Uris1,
  Uris2,
  Uris3,
  VarianceOf,
} from '@/Hkt'
import { NonEmptyArray } from '@/NonEmptyArray'

import {
  AssociativeBoth1,
  AssociativeBoth2,
  AssociativeBoth3,
  AssociativeBothHkt,
} from './AssociativeBoth'
import { unzipTuples } from './unzipTuples'

export function zipAll<U extends Uris3>(
  T: AssociativeBoth3<U> & Covariant3<U>,
): {
  '+': {
    '+': <Effects extends NonEmptyArray<Kind<U, [any, any, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<
      U,
      [
        { [K in keyof Effects]: ParamOf<U, 'R', Effects[K]> }[number],
        { [K in keyof Effects]: ParamOf<U, 'E', Effects[K]> }[number],
        { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
      ]
    >
    '-': <Effects extends NonEmptyArray<Kind<U, [any, any, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<
      U,
      [
        { [K in keyof Effects]: ParamOf<U, 'R', Effects[K]> }[number],
        TupleToIntersection<{ [K in keyof Effects]: ParamOf<U, 'E', Effects[K]> }>,
        { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
      ]
    >
    _: <E, Effects extends NonEmptyArray<Kind<U, [any, E, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<
      U,
      [
        { [K in keyof Effects]: ParamOf<U, 'R', Effects[K]> }[number],
        E,
        { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
      ]
    >
  }[VarianceOf<U, 'E'>]
  '-': {
    '+': <Effects extends NonEmptyArray<Kind<U, [any, any, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<
      U,
      [
        TupleToIntersection<{ [K in keyof Effects]: ParamOf<U, 'R', Effects[K]> }>,
        { [K in keyof Effects]: ParamOf<U, 'E', Effects[K]> }[number],
        { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
      ]
    >
    '-': <Effects extends NonEmptyArray<Kind<U, [any, any, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<
      U,
      [
        TupleToIntersection<{ [K in keyof Effects]: ParamOf<U, 'R', Effects[K]> }>,
        TupleToIntersection<{ [K in keyof Effects]: ParamOf<U, 'E', Effects[K]> }>,
        { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
      ]
    >
    _: <E, Effects extends NonEmptyArray<Kind<U, [any, E, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<
      U,
      [
        TupleToIntersection<{ [K in keyof Effects]: ParamOf<U, 'R', Effects[K]> }>,
        E,
        { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
      ]
    >
  }[VarianceOf<U, 'E'>]
  _: {
    '+': <R, Effects extends NonEmptyArray<Kind<U, [R, any, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<
      U,
      [
        R,
        { [K in keyof Effects]: ParamOf<U, 'E', Effects[K]> }[number],
        { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
      ]
    >
    '-': <R, Effects extends NonEmptyArray<Kind<U, [R, any, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<
      U,
      [
        R,
        TupleToIntersection<{ [K in keyof Effects]: ParamOf<U, 'E', Effects[K]> }>,
        { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
      ]
    >
    _: <R, E, Effects extends NonEmptyArray<Kind<U, [R, E, any]>>>(
      ...[first, ...rest]: Effects
    ) => Kind<U, [R, E, { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> }]>
  }[VarianceOf<U, 'E'>]
}[VarianceOf<U, 'R'>]

export function zipAll<U extends Uris2>(
  T: AssociativeBoth2<U> & Covariant2<U>,
): {
  '+': <Effects extends NonEmptyArray<Kind<U, [any, any]>>>(
    ...[first, ...rest]: Effects
  ) => Kind<
    U,
    [
      { [K in keyof Effects]: ParamOf<U, 'E', Effects[K]> }[number],
      { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
    ]
  >
  '-': <Effects extends NonEmptyArray<Kind<U, [any, any]>>>(
    ...[first, ...rest]: Effects
  ) => Kind<
    U,
    [
      TupleToIntersection<{ [K in keyof Effects]: ParamOf<U, 'E', Effects[K]> }>,
      { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> },
    ]
  >
  _: <E, Effects extends NonEmptyArray<Kind<U, [E, any]>>>(
    ...[first, ...rest]: Effects
  ) => Kind<U, [E, { readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> }]>
}[VarianceOf<U, 'E'>]

export function zipAll<U extends Uris1>(
  T: AssociativeBoth1<U> & Covariant1<U>,
): <Effects extends NonEmptyArray<Kind<U, [any]>>>(
  ...[first, ...rest]: Effects
) => Kind<U, [{ readonly [K in keyof Effects]: ParamOf<U, 'A', Effects[K]> }]>

export function zipAll<U>(
  T: AssociativeBothHkt<U> & CovariantHkt<U>,
): <Effects extends NonEmptyArray<Hkt<U, any>>>(
  ...[first, ...rest]: Effects
) => Hkt<U, { readonly [K in keyof Effects]: HktValue<Effects[K]> }>

export function zipAll<U>(T: AssociativeBothHkt<U> & CovariantHkt<U>) {
  return <Effects extends NonEmptyArray<Hkt<U, any>>>(
    ...[first, ...rest]: Effects
  ): Hkt<U, { [K in keyof Effects]: HktValue<Effects[K]> }> =>
    T.map(rest.reduce(T.both, first), unzipTuples) as unknown as Hkt<
      U,
      { readonly [K in keyof Effects]: HktValue<Effects[K]> }
    >
}

import {
  HKT,
  HKT2,
  HKT3,
  HKT4,
  HKT5,
  HKT6,
  HKT7,
  HKT8,
  HKT9,
  HKT10,
  Kind,
  Kind2,
  Kind3,
  Kind4,
  Kind5,
  Kind6,
  Kind7,
  Kind8,
  Kind9,
  Kind10,
  Params,
} from '@/Prelude/HKT'

import {
  AssociativeBoth,
  AssociativeBoth1,
  AssociativeBoth2,
  AssociativeBoth3,
  AssociativeBoth4,
  AssociativeBoth5,
  AssociativeBoth6,
  AssociativeBoth7,
  AssociativeBoth8,
  AssociativeBoth9,
  AssociativeBoth10,
} from '../AssociativeBoth'

export interface Category<T extends HKT> extends AssociativeBoth<T> {
  readonly id: <A>() => Kind<T, A>
}

export interface Category1<T extends HKT> extends AssociativeBoth1<T> {
  readonly id: <A>() => Kind<T, A>
}

export interface Category2<T extends HKT2> extends AssociativeBoth2<T> {
  readonly id: <A, E = T['defaults'][Params.E]>() => Kind2<T, E, A>
}

export interface Category3<T extends HKT3> extends AssociativeBoth3<T> {
  readonly id: <A, R = T['defaults'][Params.R], E = T['defaults'][Params.E]>() => Kind3<T, R, E, A>
}

export interface Category4<T extends HKT4> extends AssociativeBoth4<T> {
  readonly id: <
    A,
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >() => Kind4<T, S, R, E, A>
}

export interface Category5<T extends HKT5> extends AssociativeBoth5<T> {
  readonly id: <
    A,
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >() => Kind5<T, U, S, R, E, A>
}

export interface Category6<T extends HKT6> extends AssociativeBoth6<T> {
  readonly id: <
    A,
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >() => Kind6<T, V, U, S, R, E, A>
}

export interface Category7<T extends HKT7> extends AssociativeBoth7<T> {
  readonly id: <
    A,
    W = T['defaults'][Params.W],
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >() => Kind7<T, W, V, U, S, R, E, A>
}

export interface Category8<T extends HKT8> extends AssociativeBoth8<T> {
  readonly id: <
    A,
    X = T['defaults'][Params.X],
    W = T['defaults'][Params.W],
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >() => Kind8<T, X, W, V, U, S, R, E, A>
}

export interface Category9<T extends HKT9> extends AssociativeBoth9<T> {
  readonly id: <
    A,
    Y = T['defaults'][Params.Y],
    X = T['defaults'][Params.X],
    W = T['defaults'][Params.W],
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >() => Kind9<T, Y, X, W, V, U, S, R, E, A>
}

export interface Category10<T extends HKT10> extends AssociativeBoth10<T> {
  readonly id: <
    A,
    Z = T['defaults'][Params.Z],
    Y = T['defaults'][Params.Y],
    X = T['defaults'][Params.X],
    W = T['defaults'][Params.W],
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >() => Kind10<T, Z, Y, X, W, V, U, S, R, E, A>
}

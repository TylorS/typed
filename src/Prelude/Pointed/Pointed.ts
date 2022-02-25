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

export interface Pointed<T extends HKT> {
  readonly of: <A>(value: A) => Kind<T, A>
}

export interface Pointed1<T extends HKT> {
  readonly of: <A>(value: A) => Kind<T, A>
}

export interface Pointed2<T extends HKT2> {
  readonly of: <A, E = T['defaults'][Params.E]>(value: A) => Kind2<T, E, A>
}

export interface Pointed3<T extends HKT3> {
  readonly of: <A, R = T['defaults'][Params.R], E = T['defaults'][Params.E]>(
    value: A,
  ) => Kind3<T, R, E, A>
}

export interface Pointed4<T extends HKT4> {
  readonly of: <
    A,
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >(
    value: A,
  ) => Kind4<T, S, R, E, A>
}

export interface Pointed5<T extends HKT5> {
  readonly of: <
    A,
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >(
    value: A,
  ) => Kind5<T, U, S, R, E, A>
}

export interface Pointed6<T extends HKT6> {
  readonly of: <
    A,
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >(
    value: A,
  ) => Kind6<T, V, U, S, R, E, A>
}

export interface Pointed7<T extends HKT7> {
  readonly of: <
    A,
    W = T['defaults'][Params.W],
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >(
    value: A,
  ) => Kind7<T, W, V, U, S, R, E, A>
}

export interface Pointed8<T extends HKT8> {
  readonly of: <
    A,
    X = T['defaults'][Params.X],
    W = T['defaults'][Params.W],
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >(
    value: A,
  ) => Kind8<T, X, W, V, U, S, R, E, A>
}

export interface Pointed9<T extends HKT9> {
  readonly of: <
    A,
    Y = T['defaults'][Params.Y],
    X = T['defaults'][Params.X],
    W = T['defaults'][Params.W],
    V = T['defaults'][Params.V],
    U = T['defaults'][Params.U],
    S = T['defaults'][Params.S],
    R = T['defaults'][Params.R],
    E = T['defaults'][Params.E],
  >(
    value: A,
  ) => Kind9<T, Y, X, W, V, U, S, R, E, A>
}

export interface Pointed10<T extends HKT10> {
  readonly of: <
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
  >(
    value: A,
  ) => Kind10<T, Z, Y, X, W, V, U, S, R, E, A>
}

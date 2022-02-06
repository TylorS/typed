import { HKT, Kind } from '@/HKT'

export interface Semigroupoid<T extends HKT> {
  readonly compose: <S, R, A, B>(
    second: Kind<T, S, R, A, B>,
  ) => <C>(first: Kind<T, S, R, B, C>) => Kind<T, S, R, A, C>
}

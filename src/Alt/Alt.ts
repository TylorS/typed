import { HKT, Kind } from '@/HKT'

export interface Alt<T extends HKT> {
  readonly alt: <S, R, E, A>(
    f: () => Kind<T, S, R, E, A>,
  ) => <B>(kind: Kind<T, S, R, E, B>) => Kind<T, S, R, E, A | B>
}

export function altAll<T extends HKT>(
  F: Alt<T>,
): <S, R, E, A>(
  startWith: Kind<T, S, R, E, A>,
) => (as: ReadonlyArray<Kind<T, S, R, E, A>>) => Kind<T, S, R, E, A> {
  return (startWith) => (as) => as.reduce((acc, a) => F.alt(() => a)(acc), startWith)
}

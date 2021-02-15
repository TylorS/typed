export const capitalize = <S extends string>(s: S): Capitalize<S> =>
  (s[0].toUpperCase() + s.slice(1)) as Capitalize<S>

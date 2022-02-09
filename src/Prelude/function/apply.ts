export const apply =
  <A>(a: A) =>
  <B>(f: (a: A) => B): B =>
    f(a)

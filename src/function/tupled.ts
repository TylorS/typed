export function tupled<A extends ReadonlyArray<unknown>, B>(f: (...a: A) => B): (a: A) => B {
  return (a) => f(...a)
}

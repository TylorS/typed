export function flow2<A, B, C>(f: (a: A) => B, g: (a: B) => C): (a: A) => C {
  return (a) => g(f(a))
}

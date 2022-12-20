export function entriesOf<O>(o: O): ReadonlyArray<readonly [keyof O, O[keyof O]]> {
  return Reflect.ownKeys(o as O & object).map((k) => [k, o[k as keyof typeof o]]) as any
}

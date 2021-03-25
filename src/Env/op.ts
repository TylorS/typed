import { Resume } from '@typed/fp/Resume'

export const op = <Op>() => <K extends PropertyKey>(key: K) => <A>(f: (value: Op) => Resume<A>) => (
  e: Readonly<Record<K, Op>>,
) => f(e[key])

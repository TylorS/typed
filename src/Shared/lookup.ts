import { none, Option, some } from 'fp-ts/dist/Option'

export const lookup = <K>(key: K) => <A>(map: ReadonlyMap<K, A>): Option<A> =>
  map.has(key) ? some(map.get(key)!) : none

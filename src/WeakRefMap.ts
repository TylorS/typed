import { fromNullable, Option } from 'fp-ts/Option'

export class WeakRefMap<K, V extends object> {
  #weakRefs = new Map<K, WeakRef<V>>()
  #registry = new FinalizationRegistry((key) => this.#weakRefs.delete(key))

  has = (key: K): boolean => this.#weakRefs.has(key)

  get = (key: K) => fromNullable(this.#weakRefs.get(key)?.deref())

  set = (key: K, value: V) => {
    this.delete(key)

    const ref = new WeakRef(value)

    this.#registry.register(value, key, ref)
    this.#weakRefs.set(key, ref)

    return this
  }

  delete = (key: K) => {
    const ref = this.#weakRefs.get(key)

    if (ref) {
      this.#registry.unregister(ref)
    }

    return this.#weakRefs.delete(key)
  }
}

export const lookup = <K>(key: K) => <V extends object>(
  map: WeakRefMap<K, V>,
): Option<NonNullable<V>> => map.get(key)

export const deleteAt = <K>(key: K) => <V extends object>(
  map: WeakRefMap<K, V>,
): WeakRefMap<K, V> => (map.delete(key), map)

export const upsertAt = <K, V extends object>(key: K, value: V) => (
  map: WeakRefMap<K, V>,
): WeakRefMap<K, V> => map.set(key, value)

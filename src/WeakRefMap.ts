import { pipe } from '@fp/function'
import * as M from 'fp-ts/ReadonlyMap'

/**
 * A mutable Map where each value MUST be an object and each value will
 * weakly referenced and will be garbage collected whenever the environment sees
 * fit. Requires support for WeakRef + FinalizationRegistry.
 */
export class WeakRefMap<K, V extends object> implements Map<K, V> {
  #weakRefs = new Map<K, WeakRef<V>>()
  #registry = new FinalizationRegistry((key: K) => this.#weakRefs.delete(key))

  get size() {
    return this.#weakRefs.size
  }

  has = (key: K): boolean => this.#weakRefs.has(key)

  get = (key: K): V | undefined => this.#weakRefs.get(key)?.deref()

  set = (key: K, value: V): this => {
    const ref = new WeakRef(value)

    this.#weakRefs.delete(key)
    this.#registry.register(value, key, ref)
    this.#weakRefs.set(key, ref)

    return this
  }

  delete = (key: K): boolean => {
    const ref = this.#weakRefs.get(key)

    if (ref) {
      this.#registry.unregister(ref)
    }

    return this.#weakRefs.delete(key)
  }

  clear = () => {
    this.#weakRefs.forEach((ref) => this.#registry.unregister(ref))
    this.#weakRefs.clear()
  }

  forEach = (cb: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) => {
    const map = new Map(
      pipe(
        this.#weakRefs,
        M.map((v) => v.deref()),
        M.filter((x): x is V => x !== undefined),
      ),
    )

    this.#weakRefs.forEach((value, key) => {
      const v = value.deref()

      if (v) {
        cb(v, key, map)
      }
    }, thisArg)
  }

  entries = () => {
    const refs = this.#weakRefs

    function* getEntries() {
      for (const [k, v] of refs.entries()) {
        const x = v.deref()

        if (x) {
          yield [k, x] as [K, V]
        }
      }
    }

    return getEntries()
  }

  keys = () => {
    function* getKeys(this: WeakRefMap<K, V>) {
      for (const [k] of this.entries()) {
        yield k
      }
    }

    return getKeys.call(this)
  }

  values = () => {
    function* getValues(this: WeakRefMap<K, V>) {
      for (const [, v] of this.entries()) {
        yield v
      }
    }

    return getValues.call(this)
  };

  [Symbol.iterator](): Generator<[K, V]> {
    return this.entries()
  }

  [Symbol.toStringTag]: 'WeakRefMap'
}

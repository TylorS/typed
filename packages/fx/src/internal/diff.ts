import type { Equivalence } from "effect"
import { Equal, identity } from "effect"

export type DiffResult<A> = ReadonlyArray<Diff<A>>

export type Diff<A> = Add<A> | Remove<A> | Update<A> | Moved<A>

export interface Add<A> {
  readonly _tag: "Add"
  readonly index: number
  readonly value: A
}

export const add = <A>(value: A, index: number): Add<A> => ({ _tag: "Add", index, value })

export interface Remove<A> {
  readonly _tag: "Remove"
  readonly index: number
  readonly value: A
}

export const remove = <A>(value: A, index: number): Remove<A> => ({ _tag: "Remove", index, value })

export interface Update<A> {
  readonly _tag: "Update"
  readonly index: number
  readonly value: A
}

export const update = <A>(value: A, index: number): Update<A> => ({ _tag: "Update", index, value })

export interface Moved<A> {
  readonly _tag: "Moved"
  readonly index: number
  readonly to: number
  readonly value: A
}

export const moved = <A>(value: A, from: number, to: number): Moved<A> => ({ _tag: "Moved", index: from, to, value })

export type DiffOptions<A> = {
  readonly getKey: (a: A) => PropertyKey
  readonly eq?: Equivalence.Equivalence<A>
  readonly keyMap?: Map<PropertyKey, number>
}

export function diff<A extends PropertyKey>(
  oldValue: ReadonlyArray<A>,
  newValue: ReadonlyArray<A>,
  options?: Omit<DiffOptions<A>, "getKey">
): DiffResult<A>

export function diff<A>(
  oldValue: ReadonlyArray<A>,
  newValue: ReadonlyArray<A>,
  options: DiffOptions<A>
): DiffResult<A>

export function diff<A>(
  a: ReadonlyArray<A>,
  b: ReadonlyArray<A>,
  options: Partial<DiffOptions<A>> = {}
): DiffResult<A> {
  const { eq = Equal.equals, getKey = identity as any } = options
  const diff: Array<Diff<A>> = []
  const oldKeyMap = options.keyMap ?? getKeyMap(a, getKey)
  const keyMap = getKeyMap(b, getKey)

  for (let i = 0; i < a.length; ++i) {
    const aValue = a[i]
    const bIndex = keyMap.get(getKey(aValue))
    if (bIndex === undefined) {
      diff.push(remove(aValue, i))
    }
  }

  for (let i = 0; i < b.length; ++i) {
    const bValue = b[i]
    const aIndex = oldKeyMap.get(getKey(bValue))
    if (aIndex === undefined) {
      diff.push(add(bValue, i))
    } else {
      if (aIndex !== i) {
        diff.push(moved(bValue, aIndex, i))
      } else if (!eq(a[aIndex], bValue)) {
        diff.push(update(bValue, i))
      }
    }
  }

  return diff.sort(sortDiff)
}

export function diffIterator<A extends PropertyKey>(
  oldValue: ReadonlyArray<A>,
  newValue: ReadonlyArray<A>,
  options?: Omit<DiffOptions<A>, "getKey">
): Generator<Diff<A>>

export function diffIterator<A>(
  oldValue: ReadonlyArray<A>,
  newValue: ReadonlyArray<A>,
  options: DiffOptions<A>
): Generator<Diff<A>>

export function* diffIterator<A>(
  a: ReadonlyArray<A>,
  b: ReadonlyArray<A>,
  options: Partial<DiffOptions<A>> = {}
): Generator<Diff<A>> {
  const { eq = Equal.equals, getKey = identity as any } = options
  const oldKeyMap = options.keyMap ?? getKeyMap(a, getKey)
  const keyMap = getKeyMap(b, getKey)

  for (let i = 0; i < a.length; ++i) {
    const aValue = a[i]
    const bIndex = keyMap.get(getKey(aValue))
    if (bIndex === undefined) {
      yield remove(aValue, i)
    }
  }

  for (let i = 0; i < b.length; ++i) {
    const bValue = b[i]
    const aIndex = oldKeyMap.get(getKey(bValue))
    if (aIndex === undefined) {
      yield add(bValue, i)
    } else {
      if (aIndex !== i) {
        yield moved(bValue, aIndex, i)
      } else if (!eq(a[aIndex], bValue)) {
        yield update(bValue, i)
      }
    }
  }
}

function sortDiff<A>(a: Diff<A>, b: Diff<A>): number {
  if (a._tag === "Remove" && b._tag !== "Remove") return -1
  if (b._tag === "Remove") return 1
  return a.index - b.index
}

const keysMaps = new WeakMap<any, Map<PropertyKey, number>>()

function getKeyMap<A>(a: ReadonlyArray<A>, getKey: (a: A) => PropertyKey): Map<PropertyKey, number> {
  let keyMap = keysMaps.get(a)
  if (keyMap === undefined) {
    keyMap = new Map()
    keysMaps.set(a, keyMap)
    a.forEach((a, index) => {
      keyMap!.set(getKey(a), index)
    })
  }
  return keyMap
}

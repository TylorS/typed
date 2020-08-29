import { makeTyped } from '../io'

export type Id = string | number
export const Id = makeTyped((t) => t.union(t.string, t.number))

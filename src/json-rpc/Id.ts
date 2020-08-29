import { createSchema } from '../io'

export type Id = string | number
export const Id = createSchema((t) => t.union(t.string, t.number))

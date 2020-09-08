import { createSchema } from '../io'

export const Id = createSchema((t) => t.union(t.string, t.number))

import { createSchema } from '@typed/fp/io'

export const Id = createSchema((t) => t.union(t.string, t.number))

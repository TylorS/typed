import * as UUID from '@fp-ts/schema/data/UUID'

import { fromSchema } from './primitives.js'

export const uuid = fromSchema(UUID.UUID)

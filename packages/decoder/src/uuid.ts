import * as S from '@effect/schema/Schema'

import { fromSchema } from './primitives.js'

export const uuid = fromSchema(S.UUID)

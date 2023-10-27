import * as S from "@effect/schema/Schema"

import { fromSchema } from "@typed/decoder/primitives"

export const uuid = fromSchema(S.UUID)

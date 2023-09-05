import * as S from "@effect/schema/Schema"

import { fromSchema } from "./primitives"

export const uuid = fromSchema(S.UUID)

export const ulid = fromSchema(S.ULID)

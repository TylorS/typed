import * as Schema from "@effect/schema/Schema"
import * as NanoId from "./NanoId"
import * as Uuid from "./Uuid"

export const uuid: Schema.Schema<string, Uuid.Uuid> = Schema.string.pipe(
  Schema.fromBrand(Uuid.Uuid)
)

export const nanoId: Schema.Schema<string, NanoId.NanoId> = Schema.string.pipe(
  Schema.fromBrand(NanoId.NanoId)
)

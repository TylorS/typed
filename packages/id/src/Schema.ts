/**
 * @since 1.0.0
 */

import * as Schema from "@effect/schema/Schema"
import * as NanoId from "./NanoId.js"
import * as Uuid from "./Uuid.js"

/**
 * @since 1.0.0
 */
export const uuid: Schema.Schema<Uuid.Uuid, string> = Schema.String.pipe(
  Schema.fromBrand(Uuid.Uuid)
)

/**
 * @since 1.0.0
 */
export const nanoId: Schema.Schema<NanoId.NanoId, string> = Schema.String.pipe(
  Schema.fromBrand(NanoId.NanoId)
)

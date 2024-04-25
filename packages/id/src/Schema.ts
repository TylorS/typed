/**
 * @since 1.0.0
 */

import { Arbitrary } from "@effect/schema"
import * as Schema from "@effect/schema/Schema"
import * as NanoId from "./NanoId.js"
import * as Uuid from "./Uuid.js"

/**
 * @since 1.0.0
 */
export const uuid: Schema.Schema<Uuid.Uuid, string> = Schema.UUID.pipe(
  Schema.fromBrand(Uuid.Uuid)
)

/**
 * @since 1.0.0
 */
export const nanoId: Schema.Schema<NanoId.NanoId, string> = Schema.String.pipe(
  Schema.length(21),
  Schema.pattern(/^[A-Za-z0-9_-]+$/),
  Schema.fromBrand(NanoId.NanoId),
  Arbitrary.arbitrary(() => (fc) =>
    fc.array(fc.integer({ min: 0, max: 63 }), { minLength: 21, maxLength: 21 }).map((_) =>
      NanoId.nanoId(_ as any as NanoId.NanoIdSeed)
    )
  )
)

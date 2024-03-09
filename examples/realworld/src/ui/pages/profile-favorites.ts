import { Username } from "@/domain"
import { Schema } from "@effect/schema"
import * as Route from "@typed/route"

export const route = Route.fromPath("/profile/:username/favorites").pipe(
  Route.decode(Schema.struct({ username: Username }))
)

export type Params = Route.Output<typeof route>

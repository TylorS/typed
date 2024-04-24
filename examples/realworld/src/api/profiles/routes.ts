import { Username } from "@/model"
import * as Route from "@typed/route"
import * as Schema from "@/lib/Schema"

export const profiles = Route.literal("/profiles/:username").pipe(
  Route.withSchema(Schema.Struct({ username: Username }))
)

export const follow = Route.literal("/profiles/:username/follow").pipe(
  Route.withSchema(Schema.Struct({ username: Username }))
)

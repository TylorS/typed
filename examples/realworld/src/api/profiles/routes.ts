import { Username } from "@/domain"
import * as Schema from "@/lib/Schema"
import * as Route from "@typed/route"

export const profiles = Route.fromPath("/profiles/:username").pipe(
  Route.decode(Schema.struct({ username: Username }))
)

export const follow = Route.fromPath("/profiles/:username/follow").pipe(
  Route.decode(Schema.struct({ username: Username }))
)

import { Username } from "@/model"
import * as Route from "@typed/route"
import * as Schema from "lib/Schema"

export const profiles = Route.fromPath("/profiles/:username").pipe(
  Route.decode(Schema.struct({ username: Username }))
)

export const follow = Route.fromPath("/profiles/:username/follow").pipe(
  Route.decode(Schema.struct({ username: Username }))
)

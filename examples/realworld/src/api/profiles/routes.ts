import { Username } from "@/model"
import * as Route from "@typed/route"

export const profiles = Route.literal("profiles").concat(Route.paramWithSchema("username", Username))

export const follow = profiles.concat(Route.literal("follow"))

import { catchUnprocessable } from "@typed/realworld/api/common/handlers"
import { Tags } from "@typed/realworld/services"
import { ServerRouterBuilder } from "@typed/server"
import { Effect } from "effect"
import * as Spec from "./spec.js"

export const handleGetTags = Spec.getTags.pipe(
  ServerRouterBuilder.fromEndpoint(
    () => Tags.get().pipe(Effect.bindTo("tags"), catchUnprocessable)
  )
)

import { client } from "@typed/realworld/api/client"
import { Tags } from "@typed/realworld/services"
import { handleClientRequest } from "@typed/realworld/ui/infastructure/_client"
import { Effect } from "effect"

export const TagsLive = Tags.implement({
  get: () =>
    Effect.map(
      handleClientRequest(client.getTags({})),
      (r) => r.tags
    )
})

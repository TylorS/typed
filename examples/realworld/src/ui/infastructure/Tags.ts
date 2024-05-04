import { client } from "@realworld/api/client"
import { Tags } from "@realworld/services"
import { handleClientRequest } from "@realworld/ui/infastructure/_client"
import { Effect } from "effect"

export const TagsLive = Tags.implement({
  get: () =>
    Effect.map(
      handleClientRequest(client.getTags({})),
      (r) => r.tags
    )
})

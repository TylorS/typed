import { client } from "@/api/client"
import { Tags } from "@/services"
import { handleClientRequest } from "@/ui/infastructure/_client"
import { Effect } from "effect"

export const TagsLive = Tags.implement({
  get: () =>
    Effect.map(
      handleClientRequest(client.getTags({ path: {}, })),
      (r) => r.tags
    )
})

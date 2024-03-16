import { client } from "@/api"
import { Tags } from "@/services"
import { handleClientRequest } from "@/ui/infastructure/_client"

export const TagsLive = Tags.implement({
  get: () => handleClientRequest(client.getTags(), (r) => r.tags)
})

import { HttpApiGroup } from "@typed/server"

export const Tags = HttpApiGroup.make("Tags")

export const TagsApi = HttpApiGroup.build(Tags, (handlers) => handlers)

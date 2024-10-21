import { HttpApiGroup } from "@typed/server"

export const Comments = HttpApiGroup.make("Comments")

export const CommentsApi = HttpApiGroup.build(Comments, (handlers) => handlers)

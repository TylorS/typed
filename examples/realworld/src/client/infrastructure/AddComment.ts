import { AddComment } from "@/application"
import { Effect } from "effect"

export const AddCommentLive = AddComment.implement(() => Effect.dieMessage("Not implemented"))

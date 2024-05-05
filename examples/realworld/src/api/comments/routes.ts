import { CommentId } from "@typed/realworld/model"
import * as Route from "@typed/route"
import { article } from "../articles/routes"

export const comments = article.concat(Route.literal("comments"))

export const comment = comments.concat(Route.paramWithSchema("id", CommentId))

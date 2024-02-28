import { ArticleSlug, CommentId, Username } from "@/model"
import * as Schema from "@effect/schema/Schema"
import * as Route from "@typed/route"

export const usersRoute = Route.fromPath("/users")

export const loginRoute = usersRoute.concat(Route.fromPath("/login"))

export const userRoute = Route.fromPath("/user")

export const profileRoute = Route.fromPath("/profiles/:username")

export const ProfileParams = Schema.struct({ username: Username })
export type ProfileParams = Schema.Schema.To<typeof ProfileParams>

export const followRoute = profileRoute.concat(Route.fromPath("/follow"))

export const articlesRoute = Route.fromPath("/articles")

export const feedRoute = articlesRoute.concat(Route.fromPath("/feed"))

const slugRoute = Route.fromPath("/:slug")

export const articleRoute = articlesRoute.concat(slugRoute)

export const ArticleParams = Schema.struct({ slug: ArticleSlug })
export type ArticleParams = Schema.Schema.To<typeof ArticleParams>

export const commentsRoute = articleRoute.concat(Route.fromPath("/comments"))

export const DeleteCommentParams = Schema.struct({ slug: ArticleSlug, id: CommentId })
export type DeleteCommentParams = Schema.Schema.To<typeof DeleteCommentParams>

export const deleteCommentRoute = commentsRoute.concat(Route.fromPath("/:id"))

export const CommentsParams = Schema.struct({ slug: ArticleSlug })
export type CommentsParams = Schema.Schema.To<typeof CommentsParams>

export const favoriteRoute = articleRoute.concat(Route.fromPath("/favorite"))

export const FavoriteParams = Schema.struct({ slug: ArticleSlug })
export type FavoriteParams = Schema.Schema.To<typeof FavoriteParams>

export const tagsRoute = Route.fromPath("/tags")

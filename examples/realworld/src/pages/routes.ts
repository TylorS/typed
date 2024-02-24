import * as Schema from "@effect/schema/Schema"
import * as Route from "@typed/route"
import { ArticleSlug, Username } from "../domain"

export const homeRoute = Route.fromPath("/", { match: { end: true } }) // Ensure only matches exact path

export const loginRoute = Route.fromPath("/login")

export const registerRoute = Route.fromPath("/register")

export const settingsRoute = Route.fromPath("/settings")

export const editorRoute = Route.fromPath("/editor")

export const editArticleRoute = Route.fromPath("/editor/:slug")

export const EditArticleParams = Schema.struct({ slug: ArticleSlug })
export type EditArticleParams = Schema.Schema.To<typeof EditArticleParams>

export const articleRoute = Route.fromPath("/article/:slug")

export const ArticleParams = Schema.struct({ slug: ArticleSlug })
export type ArticleParams = Schema.Schema.To<typeof ArticleParams>

export const profileRoute = Route.fromPath("/profile/:username")

export const ProfileParams = Schema.struct({ username: Username })
export type ProfileParams = Schema.Schema.To<typeof ProfileParams>

export const favoritesRoute = Route.fromPath("/profile/:username/favorites")

export const ProfileFavoritesParams = Schema.struct({ username: Username })
export type ProfileFavoritesParams = Schema.Schema.To<typeof ProfileFavoritesParams>

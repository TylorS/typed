import { Route, Router } from "@typed/core"
import { ArticleSlug, Username } from "@typed/realworld/model"
import { isAuthenticatedGuard } from "@typed/realworld/services"

export const home = Route.home.concat(Route.queryParams({
  tag: Route.param("tag").optional(),
  page: Route.integer("page").optional(),
  myFeed: Route.boolean("myFeed").optional()
}))

export const article = Route.literal("article").concat(
  Route.paramWithSchema("slug", ArticleSlug)
)

export const editor = Route.literal("editor").pipe(isAuthenticatedGuard)

export const editArticle = Router.concat(editor, Route.paramWithSchema("slug", ArticleSlug))

export const login = Route.literal("login")

export const profile = Route.literal("profile").concat(Route.paramWithSchema("username", Username))

export const register = Route.literal("register")

export const settings = Route.literal("settings").pipe(isAuthenticatedGuard)

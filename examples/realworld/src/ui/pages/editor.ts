import { Fx, Route } from "@typed/core"
import { RefSubject } from "@typed/fx"
import { navigate } from "@typed/navigation"
import { ArticleBody, ArticleDescription, ArticleTitle } from "@typed/realworld/model"
import { Articles, isAuthenticatedGuard } from "@typed/realworld/services"
import { Effect } from "effect"
import { EditArticle, type EditArticleFields } from "../components/EditArticle"

export const route = Route.literal("editor").pipe(isAuthenticatedGuard)

export const main = Fx.gen(function*() {
  const initial = yield* RefSubject.of<EditArticleFields>({
    title: ArticleTitle(""),
    description: ArticleDescription(""),
    body: ArticleBody(""),
    tagList: []
  })

  return EditArticle(
    initial,
    (input) =>
      Effect.gen(function*(_) {
        const article = yield* _(Articles.create(input))
        yield* navigate(`/article/${article.slug}`)
      })
  )
})

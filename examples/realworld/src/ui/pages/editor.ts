import { Fx, Router } from "@typed/core"
import { RefSubject } from "@typed/fx"
import { ArticleBody, ArticleDescription, ArticleTitle } from "@typed/realworld/model"
import { Articles, isAuthenticatedGuard } from "@typed/realworld/services"
import * as Routes from "@typed/realworld/ui/common/routes"
import { Effect } from "effect"
import { EditArticle, type EditArticleFields } from "../components/EditArticle"

export const route = Routes.editor.pipe(isAuthenticatedGuard)

export const main = Fx.gen(function*() {
  const initial = yield* RefSubject.of<EditArticleFields>({
    title: ArticleTitle.make(""),
    description: ArticleDescription.make(""),
    body: ArticleBody.make(""),
    tagList: []
  })

  return EditArticle(
    initial,
    (input) =>
      Effect.gen(function*(_) {
        const article = yield* _(Articles.create(input))
        yield* Router.navigate(Routes.article, { relative: false, params: article })
      })
  )
})

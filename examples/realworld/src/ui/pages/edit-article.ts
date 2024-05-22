import { Fx, RefSubject } from "@typed/core"
import { Articles, isAuthenticatedGuard } from "@typed/realworld/services"
import * as Routes from "@typed/realworld/ui/common/routes"
import type { RouteGuard } from "@typed/router"
import { Effect } from "effect"
import { EditArticle } from "../components/EditArticle"

export const route = Routes.editArticle.pipe(isAuthenticatedGuard)

export type Params = RouteGuard.RouteGuard.Success<typeof route>

export const main = (params: RefSubject.RefSubject<Params>) =>
  Fx.gen(function*(_) {
    const article = yield* _(RefSubject.make(RefSubject.mapEffect(params, Articles.get)))

    return EditArticle(article, (fields) =>
      Effect.gen(function*(_) {
        const current = yield* article
        const updated = yield* Articles.update(current.slug, { ...current, ...fields })

        yield* RefSubject.set(article, updated)
      }))
  })

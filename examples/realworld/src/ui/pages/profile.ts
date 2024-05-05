import type { Schema } from "@effect/schema"
import { Fx, html, many, RefSubject } from "@typed/core"
import { Username } from "@typed/realworld/model"
import { Articles, Profiles } from "@typed/realworld/services"
import { defaultGetArticlesInput } from "@typed/realworld/services/GetArticles"
import { ArticlePreview } from "@typed/realworld/ui/components/ArticlePreview"
import * as Route from "@typed/route"
import { Option } from "effect"

export const route = Route.literal("profile").concat(
  Route.paramWithSchema("username", Username)
)

export type Params = Schema.Schema.Type<typeof route.schema>

export const main = (params: RefSubject.RefSubject<Params>) => {
  const profile = RefSubject.mapEffect(params, (_) => Profiles.get(_.username))
  const profileImage = RefSubject.map(profile, (p) => Option.getOrElse(p.image, () => ""))
  const profileName = RefSubject.map(profile, (p) => p.username)
  const profileBio = RefSubject.map(profile, (p) => Option.getOrElse(p.bio, () => ""))

  const articlesAndCount = RefSubject.mapEffect(profile, (_) =>
    Articles.list({
      ...defaultGetArticlesInput,
      author: Option.some(_.username)
    }))

  const articles = RefSubject.map(articlesAndCount, (a) => a.articles)

  return html`<div class="profile-page">
  <div class="user-info">
    <div class="container">
      <div class="row">
        <div class="col-xs-12 col-md-10 offset-md-1">
          <img src="${profileImage}" class="user-img" />
          <h4>${profileName}</h4>
          <p>
            ${profileBio}
          </p>
          <button class="btn btn-sm btn-outline-secondary action-btn">
            <i class="ion-plus-round" style="margin-right: 4px"></i>
            Follow ${profileName}
          </button>
          <button class="btn btn-sm btn-outline-secondary action-btn">
            <i class="ion-gear-a" style="margin-right: 4px"></i>
            Edit Profile Settings
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="row">
      <div class="col-xs-12 col-md-10 offset-md-1">
        <div class="articles-toggle">
          <ul class="outline-active nav nav-pills">
            <li class="nav-item">
              <a class="nav-link active" href="">My Articles</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="">Favorited Articles</a>
            </li>
          </ul>
        </div>

        ${
    many(
      articles,
      (a) => a.id,
      // TODO: ArticlePreview should accept an article
      Fx.switchMap(ArticlePreview)
    ).pipe(
      Fx.switchMapCause((_) => Fx.null)
    )
  }

        <ul class="pagination">
          <li class="page-item active">
            <a class="page-link" href="">1</a>
          </li>
          <li class="page-item">
            <a class="page-link" href="">2</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>`.pipe(
    Fx.switchMapCause((_) => Fx.null)
  )
}

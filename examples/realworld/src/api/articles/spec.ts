import {
  add200,
  add201,
  addJwtTokenSecurity,
  addUnauthorizedResponse,
  addUnprocessableResponse
} from "@/api/common/spec"
import * as Schema from "@/lib/Schema"
import { Article } from "@/model"
import { CreateArticleInput } from "@/services/CreateArticle"
import { GetArticlesInput } from "@/services/GetArticles"
import { GetFeedInput } from "@/services/GetFeed"
import { UpdateArticleInput } from "@/services/UpdateArticle"
import { Api, ApiGroup } from "effect-http"
import * as Routes from "./routes"

export const getFeed = Api.get(
  "getFeed",
  Routes.feed.path,
  {
    description: "Get most recent articles from users you follow. Use query parameters to limit. Auth is required."
  }
).pipe(
  Api.setRequestQuery(GetFeedInput),
  add200(Schema.struct({ articles: Schema.array(Article) })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const getArticles = Api.get(
  "getArticles",
  Routes.articles.path,
  {
    description: "Get most recent articles globally. Use query parameters to filter results. Auth is optional."
  }
).pipe(
  Api.setRequestQuery(GetArticlesInput),
  add200(Schema.struct({ articles: Schema.array(Article) })),
  addUnprocessableResponse
)

export const getArticle = Api.get(
  "getArticle",
  Routes.article.path,
  {
    description: "Get an article. Auth not required"
  }
).pipe(
  Api.setRequestPath(Routes.article.schema),
  add200(Schema.struct({ article: Article })),
  addUnprocessableResponse
)

export const createArticle = Api.post(
  "createArticle",
  Routes.articles.path,
  {
    description: "Create an article. Auth is required"
  }
).pipe(
  Api.setRequestBody(Schema.struct({ article: CreateArticleInput })),
  add201(Schema.struct({ article: Article })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const updateArticle = Api.put(
  "updateArticle",
  Routes.article.path,
  {
    description: "Update an article. Auth is required"
  }
).pipe(
  Api.setRequestPath(Routes.article.schema),
  Api.setRequestBody(Schema.struct({ article: UpdateArticleInput })),
  add200(Schema.struct({ article: Article })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const deleteArticle = Api.delete(
  "deleteArticle",
  Routes.article.path,
  {
    description: "Delete an article. Auth is required"
  }
).pipe(
  Api.setRequestPath(Routes.article.schema),
  add200(),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const favorite = Api.post(
  "favorite",
  Routes.favorites.path,
  {
    description: "Favorite an article. Auth is required"
  }
).pipe(
  Api.setRequestPath(Routes.article.schema),
  add200(Schema.struct({ article: Article })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const unfavorite = Api.delete(
  "unfavorite",
  Routes.favorites.path,
  {
    description: "Unfavorite an article. Auth is required"
  }
).pipe(
  Api.setRequestPath(Routes.article.schema),
  add200(Schema.struct({ article: Article })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const ArticlesSpec = ApiGroup.make("Articles").pipe(
  ApiGroup.addEndpoint(getFeed),
  ApiGroup.addEndpoint(getArticles),
  ApiGroup.addEndpoint(getArticle),
  ApiGroup.addEndpoint(createArticle),
  ApiGroup.addEndpoint(updateArticle),
  ApiGroup.addEndpoint(deleteArticle),
  ApiGroup.addEndpoint(favorite),
  ApiGroup.addEndpoint(unfavorite)
)

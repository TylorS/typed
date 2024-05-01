import {
  add200,
  add201,
  addJwtTokenSecurity,
  addOptionalJwtTokenSecurity,
  addUnauthorizedResponse,
  addUnprocessableResponse
} from "@/api/common/spec"
import * as Schema from "@/lib/Schema"
import { Article } from "@/model"
import { CreateArticleInput } from "@/services/CreateArticle"
import { GetArticlesInput } from "@/services/GetArticles"
import { GetFeedInput } from "@/services/GetFeed"
import { UpdateArticleInput } from "@/services/UpdateArticle"
import { Api, ApiGroup } from "@typed/server"
import * as Routes from "./routes"

export const getFeed = Api.get(
  "getFeed",
  Routes.feed,
  {
    description: "Get most recent articles from users you follow. Use query parameters to limit. Auth is required."
  }
).pipe(
  Api.setRequestQuery(GetFeedInput),
  add200(Schema.Struct({ articles: Schema.Array(Article), articlesCount: Schema.Number })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const getArticles = Api.get(
  "getArticles",
  Routes.articles,
  {
    description: "Get most recent articles globally. Use query parameters to filter results. Auth is optional."
  }
).pipe(
  Api.setRequestQuery(GetArticlesInput),
  add200(Schema.Struct({ articles: Schema.Array(Article), articlesCount: Schema.Number })),
  addUnprocessableResponse,
  addOptionalJwtTokenSecurity
)

export const getArticle = Api.get(
  "getArticle",
  Routes.article,
  {
    description: "Get an article. Auth not required"
  }
).pipe(
  add200(Schema.Struct({ article: Article })),
  addUnprocessableResponse,
  addOptionalJwtTokenSecurity
)

export const createArticle = Api.post(
  "createArticle",
  Routes.articles,
  {
    description: "Create an article. Auth is required"
  }
).pipe(
  Api.setRequestBody(Schema.Struct({ article: CreateArticleInput })),
  add201(Schema.Struct({ article: Article })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const updateArticle = Api.put(
  "updateArticle",
  Routes.article,
  {
    description: "Update an article. Auth is required"
  }
).pipe(
  Api.setRequestBody(Schema.Struct({ article: UpdateArticleInput })),
  add200(Schema.Struct({ article: Article })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const deleteArticle = Api.delete(
  "deleteArticle",
  Routes.article,
  {
    description: "Delete an article. Auth is required"
  }
).pipe(
  add200(),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const favorite = Api.post(
  "favorite",
  Routes.favorites,
  {
    description: "Favorite an article. Auth is required"
  }
).pipe(
  add200(Schema.Struct({ article: Article })),
  addUnauthorizedResponse,
  addUnprocessableResponse,
  addJwtTokenSecurity
)

export const unfavorite = Api.delete(
  "unfavorite",
  Routes.favorites,
  {
    description: "Unfavorite an article. Auth is required"
  }
).pipe(
  add200(Schema.Struct({ article: Article })),
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

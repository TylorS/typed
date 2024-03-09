import { security } from "@/api/common/security"
import { Article, ArticleTag, Username } from "@/domain"
import * as Schema from "@/lib/Schema"
import { Api } from "effect-http"
import * as Routes from "./routes"

export const ArticlesSpec = Api.apiGroup("Articles").pipe(
  Api.get(
    "getFeed",
    Routes.feed.path,
    {
      query: Schema.struct({
        limit: Schema.optionalOrNull(Schema.number),
        offset: Schema.optionalOrNull(Schema.number)
      }),
      response: [
        { status: 200, content: Schema.struct({ articles: Schema.array(Article) }) },
        { status: 401 },
        { status: 422 }
      ]
    },
    {
      description: "Get most recent articles from users you follow. Use query parameters to limit. Auth is required."
    }
  ),
  Api.get(
    "getArticles",
    Routes.articles.path,
    {
      query: Schema.struct({
        tag: Schema.optionalOrNull(ArticleTag),
        author: Schema.optionalOrNull(Username),
        favorited: Schema.optionalOrNull(Username),
        limit: Schema.optionalOrNull(Schema.number),
        offset: Schema.optionalOrNull(Schema.number)
      }),
      response: [
        { status: 200, content: Schema.struct({ articles: Schema.array(Article) }) },
        { status: 401 },
        { status: 422 }
      ]
    },
    {
      description: "Get most recent articles globally. Use query parameters to filter results. Auth is optional."
    }
  ),
  Api.get(
    "getArticle",
    Routes.article.path,
    {
      params: Routes.article.schema,
      response: [
        { status: 200, content: Schema.struct({ article: Article }) },
        { status: 422 }
      ]
    },
    {
      description: "Get an article. Auth not required"
    }
  ),
  Api.post(
    "createArticle",
    Routes.articles.path,
    {
      response: [
        { status: 201, content: Schema.struct({ article: Article }) },
        { status: 401 },
        { status: 422 }
      ]
    },
    {
      security,
      description: "Create an article. Auth is required"
    }
  ),
  Api.put(
    "updateArticle",
    Routes.article.path,
    {
      params: Routes.article.schema,
      response: [
        { status: 200, content: Schema.struct({ article: Article }) },
        { status: 401 },
        { status: 422 }
      ]
    },
    {
      security,
      description: "Update an article. Auth is required"
    }
  ),
  Api.delete(
    "deleteArticle",
    Routes.article.path,
    {
      params: Routes.article.schema,
      response: [
        { status: 200 },
        { status: 401 },
        { status: 422 }
      ]
    },
    {
      security,
      description: "Delete an article. Auth is required"
    }
  )
)

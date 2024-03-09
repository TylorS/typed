import { jwtToken } from "@/api/common/security"
import { Article } from "@/domain"
import { Schema } from "@effect/schema"
import { Api } from "effect-http"
import * as Routes from "./routes"

export const ArticlesSpec = Api.apiGroup("Articles").pipe(
  Api.get(
    "getFeed",
    Routes.feed.path,
    {
      response: [
        { status: 200, content: Schema.struct({ articles: Schema.array(Article) }) }
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
      response: [
        { status: 200, content: Schema.struct({ articles: Schema.array(Article) }) }
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
      response: [
        { status: 200, content: Schema.struct({ article: Article }) }
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
        { status: 201, content: Schema.struct({ article: Article }) }
      ]
    },
    {
      security: { jwtToken },
      description: "Create an article. Auth is required"
    }
  ),
  Api.put(
    "updateArticle",
    Routes.article.path,
    {
      response: [
        { status: 200, content: Schema.struct({ article: Article }) }
      ]
    },
    {
      security: { jwtToken },
      description: "Update an article. Auth is required"
    }
  ),
  Api.delete(
    "deleteArticle",
    Routes.article.path,
    {
      response: [
        { status: 200 }
      ]
    },
    {
      security: { jwtToken },
      description: "Delete an article. Auth is required"
    }
  )
)

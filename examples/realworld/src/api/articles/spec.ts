import { Api } from "effect-http"
import * as Routes from "./routes"

export const ArticlesSpec = Api.apiGroup("Articles").pipe(
  Api.get("getFeed", Routes.feed.path, {}, {
    description: "Get most recent articles from users you follow. Use query parameters to limit. Auth is required."
  }),
  Api.get("getArticles", Routes.articles.path, {}, {
    description: "Get most recent articles globally. Use query parameters to filter results. Auth is optional."
  }),
  Api.get("getArticle", Routes.article.path, {}, {
    description: "Get an article. Auth not required"
  }),
  Api.post("createArticle", Routes.articles.path, {}, {
    description: "Create an article. Auth is required"
  }),
  Api.put("updateArticle", Routes.article.path, {}, {
    description: "Update an article. Auth is required"
  }),
  Api.delete("deleteArticle", Routes.article.path, {}, {
    description: "Delete an article. Auth is required"
  })
)

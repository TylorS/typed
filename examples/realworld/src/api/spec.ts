import * as Domain from "@/model"
import * as App from "@/services"
import { Schema } from "@effect/schema"
import { Api } from "effect-http"
import * as Routes from "./routes"

const jwtSecurityScheme = {
  security: {
    jwtTokenAuth: {
      type: "http",
      options: {
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      schema: Domain.JwtToken
    }
  }
} as const

export const UsersGroup = Api.apiGroup("Users").pipe(
  Api.post(
    "login",
    Routes.loginRoute.path,
    {
      description: "Login to the application",
      request: {
        body: Schema.struct({ user: App.LoginInput })
      },
      response: Schema.struct({ user: Domain.User })
    }
  ),
  Api.get(
    "getCurrentUser",
    Routes.userRoute.path,
    {
      description: "Get current user",
      response: Schema.struct({ user: Domain.User })
    },
    jwtSecurityScheme
  ),
  Api.post(
    "register",
    Routes.userRoute.path,
    {
      description: "Register a user",
      request: {
        body: Schema.struct({ user: App.CreateUserInput })
      },
      response: Schema.struct({ user: Domain.User })
    }
  ),
  Api.put(
    "updateCurrentUser",
    Routes.userRoute.path,
    {
      description: "Update current user",
      request: {
        body: Schema.struct({ user: App.UpdateUserInput })
      },
      response: Schema.struct({ user: Domain.User })
    },
    jwtSecurityScheme
  )
)

export const ProfilesGroup = Api.apiGroup("Profiles").pipe(
  Api.get(
    "getProfile",
    Routes.profileRoute.path,
    {
      description: "Get a profile by username",
      request: {
        params: Routes.ProfileParams
      },
      response: Schema.struct({ profile: Domain.Profile })
    }
  ),
  Api.post(
    "followUser",
    Routes.followRoute.path,
    {
      description: "Follow a user by username",
      request: {
        params: Routes.ProfileParams
      },
      response: Schema.struct({ profile: Domain.Profile })
    },
    jwtSecurityScheme
  ),
  Api.delete(
    "unfollowUser",
    Routes.followRoute.path,
    {
      description: "Unfollow a user by username",
      request: {
        params: Routes.ProfileParams
      },
      response: Schema.struct({ profile: Domain.Profile })
    },
    jwtSecurityScheme
  )
)

export const ArticlesGroup = Api.apiGroup("Articles").pipe(
  Api.get(
    "getArticles",
    Routes.articlesRoute.path,
    {
      description: "Get the most recent articles globally",
      request: {
        query: App.GetArticlesInput
      },
      response: Schema.struct({ articles: Schema.array(Domain.Article) })
    }
  ),
  Api.get(
    "getFeed",
    Routes.feedRoute.path,
    {
      description: "Get the most recent articles from users you follow",
      request: {
        query: App.GetFeedInput
      },
      response: Schema.struct({ articles: Schema.array(Domain.Article) })
    },
    jwtSecurityScheme
  ),
  Api.get(
    "getArticle",
    Routes.articleRoute.path,
    {
      description: "Get an article by slug",
      request: {
        params: Routes.ArticleParams
      },
      response: Schema.struct({ article: Domain.Article })
    }
  ),
  Api.post(
    "createArticle",
    Routes.articlesRoute.path,
    {
      description: "Create an article",
      request: {
        body: Schema.struct({ article: App.CreateArticleInput })
      },
      response: Schema.struct({ article: Domain.Article })
    },
    jwtSecurityScheme
  ),
  Api.put(
    "updateArticle",
    Routes.articleRoute.path,
    {
      description: "Update an article by slug",
      request: {
        params: Routes.ArticleParams,
        body: Schema.struct({ article: App.UpdateArticleInput })
      },
      response: Schema.struct({ article: Domain.Article })
    },
    jwtSecurityScheme
  ),
  Api.delete(
    "deleteArticle",
    Routes.articleRoute.path,
    {
      description: "Delete an article by slug",
      request: {
        params: Routes.ArticleParams
      },
      response: Schema.struct({ article: Domain.Article })
    },
    jwtSecurityScheme
  ),
  Api.post(
    "favoriteArticle",
    Routes.favoriteRoute.path,
    {
      description: "Favorite an article by slug",
      request: {
        params: Routes.FavoriteParams
      },
      response: Schema.struct({ article: Domain.Article })
    },
    jwtSecurityScheme
  ),
  Api.delete(
    "unfavoriteArticle",
    Routes.favoriteRoute.path,
    {
      description: "Unfavorite an article by slug",
      request: {
        params: Routes.FavoriteParams
      },
      response: Schema.struct({ article: Domain.Article })
    },
    jwtSecurityScheme
  )
)

export const CommentsGroup = Api.apiGroup("Comments").pipe(
  Api.get(
    "listComments",
    Routes.commentsRoute.path,
    {
      description: "List comments for an article",
      request: {
        params: Routes.CommentsParams
      },
      response: Schema.struct({ comments: Schema.array(Domain.Comment) })
    }
  ),
  Api.post(
    "addComment",
    Routes.commentsRoute.path,
    {
      description: "Create a comment for an article",
      request: {
        params: Routes.CommentsParams,
        body: Schema.struct({ comment: App.AddCommentInput })
      },
      response: Schema.struct({ comment: Domain.Comment })
    },
    jwtSecurityScheme
  ),
  Api.delete(
    "deleteComment",
    Routes.deleteCommentRoute.path,
    {
      description: "Delete a comment by id",
      request: {
        params: Routes.DeleteCommentParams
      },
      response: Schema.struct({ comment: Domain.Comment })
    },
    jwtSecurityScheme
  )
)

export const TagsGroup = Api.apiGroup("Tags").pipe(
  Api.get("listTags", Routes.tagsRoute.path, {
    description: "List the tags used in articles",
    response: Schema.struct({ tags: Schema.array(Domain.ArticleTag) })
  })
)

export const Spec = Api.api({ title: "Realworld", servers: ["http://localhost:3000/api"] }).pipe(
  Api.addGroup(UsersGroup),
  Api.addGroup(ProfilesGroup),
  Api.addGroup(ArticlesGroup),
  Api.addGroup(CommentsGroup),
  Api.addGroup(TagsGroup)
)

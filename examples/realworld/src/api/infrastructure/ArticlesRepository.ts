import type * as Context from "@typed/context"
import { Effect, Option } from "effect"
import { ArticlesRepository, UserRepository } from "../../application"
import type { Article, Email } from "../../domain"
import { ArticleSlug, ArticleTag, userToProfile } from "../../domain"

// TODO: Better errors
// TODO: Verify JWTs

export const ArticlesRespsitoryLayer = ArticlesRepository.layer(Effect.gen(function*(_) {
  const articles = new Map<ArticleSlug, Article>()
  const favorites = new Map<Email, Set<ArticleSlug>>()
  const users = yield* _(UserRepository)

  const getArticle = (id: ArticleSlug) => {
    if (!articles.has(id)) {
      return Effect.dieMessage(`Article with slug ${id} not found`)
    }

    return Effect.succeed(articles.get(id)!)
  }

  const fns: Context.Tagged.Service<typeof ArticlesRepository> = {
    list: (input) => Effect.succeed([...articles.values()]),
    feed: (input) => {
      const limit = Option.getOrElse(input.limit, () => 20)
      const offset = Option.getOrElse(input.offset, () => 0)

      return Effect.succeed(Array.from(articles.values()).slice(-(limit - offset)))
    },
    get: (slug) => getArticle(slug),
    create: (input, token) =>
      Effect.gen(function*(_) {
        const now = new Date()
        const article: Article = {
          slug: titleToSlug(input.title),
          title: input.title,
          description: input.description,
          body: input.body,
          tagList: input.tagList,
          createdAt: now,
          updatedAt: now,
          favorited: false,
          favoritesCount: 0,
          // TODO: Better author management
          author: userToProfile(yield* _(users.current(token)), false)
        }

        articles.set(article.slug, article)

        return article
      }),
    update: (slug, input, token) =>
      Effect.gen(function*(_) {
        const user = yield* _(users.current(token))
        const article = yield* _(getArticle(slug))

        if (article.author.username !== user.username) {
          return yield* _(Effect.dieMessage("You can only update your own articles"))
        }

        const updatedArticle: Article = {
          ...article,
          title: input.title,
          description: input.description,
          body: input.body,
          tagList: input.tagList,
          updatedAt: new Date()
        }

        articles.set(article.slug, updatedArticle)

        return updatedArticle
      }),
    delete: (slug, token) =>
      Effect.gen(function*(_) {
        const user = yield* _(users.current(token))
        const article = yield* _(getArticle(slug))

        if (article.author.username !== user.username) {
          return yield* _(Effect.dieMessage("You can only delete your own articles"))
        }

        articles.delete(slug)

        return article
      }),
    favorite: (slug, token) =>
      Effect.gen(function*(_) {
        const user = yield* _(users.current(token))
        const article = yield* _(getArticle(slug))

        if (article.favorited) {
          return article
        }

        article.favorited = true
        article.favoritesCount++

        return article
      })
  }

  return fns
}))

function titleToSlug(title: string) {
  return ArticleSlug(title.toLowerCase().replace(/ /g, "-"))
}

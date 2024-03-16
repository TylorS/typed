import { ArticlesLive } from "@/api/articles/infrastructure/ArticlesLive"
import { CommentsLive } from "@/api/comments/infrastructure/CommentsLive"
import { DbLive } from "@/api/common/infrastructure/db"
import { ProfilesLive } from "@/api/profiles/infrastructure/ProfilesLive"
import { TagsLive } from "@/api/tags/infrastructure/TagsLive"
import { UsersLive } from "@/api/users/infrastructure/UsersLive"
import { getRandomValues } from "@typed/id"
import { ConfigProvider, Layer } from "effect"

export const Live = Layer.mergeAll(ArticlesLive, CommentsLive, ProfilesLive, TagsLive, UsersLive).pipe(
  Layer.provideMerge(DbLive),
  Layer.provideMerge(getRandomValues),
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromJson(import.meta.env)))
)

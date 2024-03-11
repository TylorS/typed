import { ArticlesSpec } from "@/api/articles"
import { CommentsSpec } from "@/api/comments"
import { FavoritesSpec } from "@/api/favorites"
import { ProfilesSpec } from "@/api/profiles"
import { TagsSpec } from "@/api/tags"
import { UsersSpec } from "@/api/users"
import { Api } from "effect-http"

export const Spec = Api.api({
  title: "Realworld",
  // TODO: Replace with something better
  servers: [`http://localhost:${import.meta.env.PROD ? "3000" : "5173"}/api`]
}).pipe(
  Api.addGroup(ArticlesSpec),
  Api.addGroup(CommentsSpec),
  Api.addGroup(FavoritesSpec),
  Api.addGroup(ProfilesSpec),
  Api.addGroup(TagsSpec),
  Api.addGroup(UsersSpec)
)

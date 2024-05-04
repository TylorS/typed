import { ArticlesSpec } from "@realworld/api/articles"
import { CommentsSpec } from "@realworld/api/comments"
import { ProfilesSpec } from "@realworld/api/profiles"
import { TagsSpec } from "@realworld/api/tags"
import { UsersSpec } from "@realworld/api/users"
import { Api } from "@typed/server"

export const Spec = Api.make({
  title: "Realworld",
  servers: [`http://localhost:${import.meta.env.PROD ? "3000" : "5173"}/api`]
}).pipe(
  Api.addGroup(ArticlesSpec),
  Api.addGroup(CommentsSpec),
  Api.addGroup(ProfilesSpec),
  Api.addGroup(TagsSpec),
  Api.addGroup(UsersSpec)
)

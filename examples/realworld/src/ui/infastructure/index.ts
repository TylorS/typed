import { ArticlesLive } from "@/ui/infastructure/Articles"
import { CommentsLive } from "@/ui/infastructure/Comments"
import { CurrentUserLive, ReadJwtTokenLive, SaveJwtTokenLive } from "@/ui/infastructure/CurrentUser"
import { ProfilesLive } from "@/ui/infastructure/Profiles"
import { TagsLive } from "@/ui/infastructure/Tags"
import { UsersLive } from "@/ui/infastructure/Users"
import { Layer } from "effect"

export const Live = Layer.mergeAll(
  ArticlesLive,
  CommentsLive,
  ProfilesLive,
  TagsLive,
  UsersLive
).pipe(
  Layer.provideMerge(
    Layer.mergeAll(
      CurrentUserLive,
      ReadJwtTokenLive,
      SaveJwtTokenLive
    )
  )
)

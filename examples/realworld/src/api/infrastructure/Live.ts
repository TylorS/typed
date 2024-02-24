import { Layer } from "effect"
import { ArticlesRespsitoryLayer } from "./ArticlesRepository"
import { CommentsRespsitoryLayer } from "./CommentsReporisotry"
import { ProfilesRespsitoryLayer } from "./ProfilesRepository"
import { UserRepositoryLayer } from "./UserRepository"

export const ApiLive = Layer.mergeAll(
  ArticlesRespsitoryLayer,
  CommentsRespsitoryLayer,
  ProfilesRespsitoryLayer,
  UserRepositoryLayer
)

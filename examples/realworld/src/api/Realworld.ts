import { HttpApi } from "@typed/server"
import { Articles } from "./Articles"
import { Comments } from "./Comments"
import { Profiles } from "./Profiles"
import { Tags } from "./Tags"
import { Users } from "./Users"

export const Realworld = HttpApi.empty.pipe(
  HttpApi.addGroup(Users),
  HttpApi.addGroup(Profiles),
  HttpApi.addGroup(Tags),
  HttpApi.addGroup(Articles),
  HttpApi.addGroup(Comments)
)

import { HttpApiGroup } from "@typed/server"

export const Users = HttpApiGroup.make("Users")

export const UsersApi = HttpApiGroup.build(Users, (handlers) => handlers)

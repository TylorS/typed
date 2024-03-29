import * as Route from "@typed/route"

export const user = Route.literal("/user")

export const users = Route.literal("/users")

export const login = users.concat(Route.literal("/login"))

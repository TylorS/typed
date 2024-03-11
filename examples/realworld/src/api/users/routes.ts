import * as Route from "@typed/route"

export const users = Route.fromPath("/users")

export const login = users.concat(Route.fromPath("/login"))

// import { Api, ApiResponse, Security } from "@typed/server"
import { HttpApiSecurity } from "@typed/server/V2"

export const jwtTokenSecurity = HttpApiSecurity.authorization("Token").pipe(
  HttpApiSecurity.or(HttpApiSecurity.apiKey({
    key: "conduit-token",
    in: "cookie"
  }))
)

export const optionalJwtTokenSecurity = HttpApiSecurity.optional(jwtTokenSecurity)

export type JwtTokenSecurity = typeof jwtTokenSecurity
export type OptionalJwtTokenSecurity = typeof optionalJwtTokenSecurity

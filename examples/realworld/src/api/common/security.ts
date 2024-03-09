import type { SecurityScheme } from "effect-http/SecurityScheme"
import { JwtToken } from "../../domain/User"

export const jwtToken: SecurityScheme<JwtToken> = {
  type: "http",
  options: {
    scheme: "bearer"
  },
  schema: JwtToken
}

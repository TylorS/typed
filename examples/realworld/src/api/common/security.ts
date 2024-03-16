import { JwtToken } from "@/model"
import type { SecurityScheme } from "effect-http/SecurityScheme"
import * as Schema from "lib/Schema"

const jwtTokenSchema = Schema.string.pipe(
  Schema.transform(JwtToken, (f) => JwtToken(f.split(" ")[1]), (t) => `Token ${t}`)
)

export const jwtTokenSecuritySchema: SecurityScheme<JwtToken> = {
  type: "http",
  options: {
    scheme: "bearer"
  },
  schema: jwtTokenSchema
}

export const security = { jwtToken: jwtTokenSecuritySchema } as const

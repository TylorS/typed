import { JwtToken } from "@/domain"
import * as Schema from "@/lib/Schema"
import type { SecurityScheme } from "effect-http/SecurityScheme"

export const jwtTokenSecuritySchema: SecurityScheme<JwtToken> = {
  type: "http",
  options: {
    scheme: "bearer"
  },
  schema: Schema.string.pipe(Schema.transform(JwtToken, (f) => JwtToken(f.split(" ")[1]), (t) => `Token ${t}`))
}

export const security = { jwtToken: jwtTokenSecuritySchema } as const

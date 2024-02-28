import { Secret } from "effect"
import { createHash } from "node:crypto"

export function makePasswordHash(password: string): Secret.Secret {
  const hash = createHash("sha256")
  hash.update(password)
  return Secret.fromString(hash.digest("hex"))
}

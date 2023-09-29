import * as Context from "@typed/context"

export interface RenderContext {
  /**
   * The current environment.
   */
  readonly environment: "server" | "browser" | "static"

  /**
   * Whether or not the current render is for a bot.
   */
  readonly isBot: boolean
}

export const RenderContext: Context.Tagged<RenderContext, RenderContext> = Context.Tagged<RenderContext>(
  "@typed/template/RenderContext"
)

export type RenderContextOptions = {
  readonly environment: RenderContext["environment"]
  readonly isBot?: RenderContext["isBot"]
}

export function make({
  environment,
  isBot = false
}: RenderContextOptions): RenderContext {
  return {
    environment,
    isBot
  }
}

export type Environment = RenderContext["environment"]

export const Environment: { readonly [_ in Environment]: _ } = {
  server: "server",
  browser: "browser",
  static: "static"
}

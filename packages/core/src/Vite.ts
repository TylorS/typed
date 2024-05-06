/**
 * @since 1.0.0
 */

import * as Fx from "@typed/fx"
import type { RenderEvent, RenderQueue, RenderTemplate } from "@typed/template"
import { HtmlRenderEvent } from "@typed/template"
import type { AssetManifest } from "@typed/vite-plugin"
import type * as Scope from "effect/Scope"

/**
 * @since 1.0.0
 */
export function getHeadAndScript(
  entry: string,
  manifest: AssetManifest
): {
  readonly head: Fx.Fx<
    RenderEvent,
    never,
    RenderTemplate | RenderQueue.RenderQueue | Scope.Scope
  >
  readonly script: Fx.Fx<
    RenderEvent,
    never,
    RenderTemplate | RenderQueue.RenderQueue | Scope.Scope
  >
} {
  // TODO: This application is configured to use scripts, we should be able to use modules as well for production
  const useScript = entry in manifest
  const { css = [], file, imports = [] } = useScript ? manifest[entry] : { file: entry }
  const modulePreloads = [file, ...imports.map((i) => manifest[i]?.file ?? i)]
  const styles = [...css, ...imports.flatMap((i) => manifest[i]?.css ?? [])]

  const headHtml = [
    ...styles.map(makeStylesheetLink),
    ...modulePreloads.map((src) =>
      makePreloadLink(useScript ? "preload" : "modulepreload", src, useScript ? "script" : undefined)
    )
  ].join("\n")
  const scriptHtml = `<script ${useScript ? "async defer" : `type="module"`} src="${file}"></script>`

  return {
    head: Fx.succeed(HtmlRenderEvent(headHtml, true)),
    script: Fx.succeed(HtmlRenderEvent(scriptHtml, true))
  }
}

function makePreloadLink(rel: string, href: string, as?: string) {
  return `<link rel="${rel}" href="${href}"${as ? ` as="${as}"` : ""} />`
}

function makeStylesheetLink(href: string) {
  return `<link rel="stylesheet" type="text/css" href="${href}" />`
}

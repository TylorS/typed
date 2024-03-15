import * as Fx from "@typed/fx"
import type { RenderEvent, RenderQueue, RenderTemplate } from "@typed/template"
import { html } from "@typed/template"
import type { AssetManifest } from "@typed/vite-plugin"
import type { Scope } from "effect"

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

  return {
    head: Fx.mergeOrdered([
      ...modulePreloads.map((src) =>
        html`<link rel="${useScript ? "preload" : "modulepreload"}" crossOrigin href=${src} />`
      ),
      ...styles.map((href) => html`<link rel="stylesheet" href=${href} />`)
    ]),
    script: html`<script type=${useScript ? undefined : "module"} src=${file}></script>`
  }
}
